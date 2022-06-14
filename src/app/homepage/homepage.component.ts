import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, NgForm} from "@angular/forms";
import {HttpClient} from "@angular/common/http";
import {Apollo, gql} from "apollo-angular";

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})

export class HomepageComponent implements OnInit {
  users: any = [];
  cities: any = [];
  myForm: any = FormGroup;
  tableVisible = false;
  button2Enabled = false;

  table2Values: any = [];
  table2Visible = false;

  constructor(
    public fb: FormBuilder,
    private http: HttpClient,
    private apollo: Apollo
  ) {
  }

  ngOnInit(): void {
    this.reactiveForm();

    this.http.get('http://localhost:4000/users')
      .subscribe({
        next: (response) => this.users = response,
        error: (error) => console.log(error),
      })

  }

  reactiveForm() {
    this.myForm = this.fb.group({
      tara: [''],
      oras: [''],
      user: [],
      dov: ''
    });
  }

  submitForm() {
    const id =  parseInt(this.myForm.value.user);
    const StringDate = this.myForm.value.dov.toString();
    const data =  {
      "city_name": this.myForm.value.oras,
      "country_name": this.myForm.value.tara,
      "date_visited": StringDate
    }

    this.http.post('http://localhost:4000/users/ ' + parseInt(this.myForm.value.user) + '/cities', data)
      .subscribe({
        next: (response) => this.users = response,
        error: (error) => console.log(error),
      })

    this.http.get('http://localhost:4000/users?_embed=cities')
      .subscribe({
        next: (response) => this.bindResponse(response),
        error: (error) => console.log(error.message),
      })
  }

  bindResponse(response: any) {
    this.users = response;
    this.tableVisible = true;
    this.button2Enabled = true;
  }

  displayValuesInTable() {
    this.apollo
    .watchQuery({
      query : gql`
        {
          users {
            first_name,
            last_name,
            age
            cities {
              city_name,
              country_name,
              date_visited
            }
          }
        }
      `,
    })
    .valueChanges.subscribe((result: any) => {
      this.table2Values = result.data.users;
      this.table2Visible = true;

    });
  }

  insertTableValuesInServer2() {
    this.users.forEach((user: any) => {
      const firstName = user.first_name;
      const lastName = user.last_name;
      const age = user.age;
      const userId = user.id;

      user.cities.forEach((city: any) => {
        const cityName = city.city_name;
        const countryName = city.country_name;
        const dateVisited = city.date_visited;

        const addNewCity = gql`
          mutation addCity($city_name: String!, $country_name: String!, $date_visited: String!, $userId: Int! ) {
            addCity(city_name: $city_name, country_name: $country_name, date_visited: $date_visited, userId: $userId) {
              id,
              city_name,
              date_visited
            }
          }
        `;

        this.apollo
        .mutate({
          mutation: addNewCity,
          variables: {
            city_name: cityName,
            country_name: countryName,
            date_visited: dateVisited,
            userId: userId
          }
        })
        .subscribe((result: any) => {
          console.log(result);
        });
      })

      const addNewUser = gql`
        mutation addUser($first_name: String!, $last_name: String!, $age: Int!) {
          addUser(first_name: $first_name, last_name: $last_name, age: $age) {
            id,
            first_name
          }
        }
      `;

      this.apollo
        .mutate({
          mutation: addNewUser,
          variables: {
            first_name: firstName,
            last_name: lastName,
            age: age
          }
        })
        .subscribe((result: any) => {
          console.log(result);
        });
    });

    this.displayValuesInTable();
  }
}
