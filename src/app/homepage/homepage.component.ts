import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Apollo, gql} from "apollo-angular";
import { DatePipe } from '@angular/common';

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

  table2Values: any = [];
  table2Visible = false;
  button2Enabled = false;

  table3Values: any = [];
  table3Visible = false;
  button3Enabled = false;

  table4Values: any = [];
  table4Headings: any = [];
  table4Visible = false;

  usersGraph = '';
  citiesGraph = '';

  constructor(
    public fb: FormBuilder,
    private http: HttpClient,
    private apollo: Apollo,
    private datePipe: DatePipe
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
      tara: [null, Validators.required],
      oras: [null, Validators.required],
      user: [null, Validators.required],
      dov: [null, Validators.required]
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

    this.http.post('http://localhost:4000/users/' + id + '/cities', data)
      .subscribe({
        next: (response) => this.bindResponse(response),
        error: (error) => console.log(error),
      })
  }

  bindResponse(response: any) {
    this.http.get('http://localhost:4000/users?_embed=cities')
      .subscribe({
        next: (response) =>  this.users = response,
        error: (error) => console.log(error.message),
      })
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
    this.button3Enabled = true;
  }

  insertTableValuesInServer3() {
    console.log(this.table2Values);
    const headers= new HttpHeaders()
      .set('content-type', 'application/x-trig')
      .set('Access-Control-Allow-Origin', '*');

    this.table2Values.forEach((item: any, index: any) =>{
      const userIndex = index;

      const entry = 'user:' + index + ' :hasName ' + '"' + item.first_name + item.last_name + '" .\n'
        + 'user:' + index + ' :is :person .\n'
        + 'user:' + index + ' :hasAge ' + item.age + '.\n';
      this.usersGraph += entry;

      item.cities.forEach((item: any, index: any) => {
        const datePipeString = this.datePipe.transform(item.date_visited,'yyyy-MM-dd');
        const userEntry = 'user:' + userIndex + ' '
          + ':visited _:n' + index + '.\n'
          + '_:n' + index + ' :dateVisited '
          + '"' + datePipeString + '"^^xsd:date;\n :visitedCity :'
          + item.city_name + ' .\n';
        this.usersGraph += userEntry;

        const cityEntry = ':' + item.city_name + ' :partOf :' + item.country_name + '.\n';
        this.citiesGraph += cityEntry;
      })
    });

    console.log(this.usersGraph);
    console.log(this.citiesGraph);

    const data =
      `@prefix : <http://bicaveres.ro#>.
@prefix user: <http://bicaveres.ro/users#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

:users
{\n`
      + this.usersGraph +
`
}
:cities
{\n`
    + this.citiesGraph +
`
}`;
    this.http.put('http://localhost:7200/repositories/graph/statements', data, {'headers': headers})
      .subscribe({
        next: (response) => this.bindResponseGraphDB(response),
        error: (error) => console.log(error.message),
      })
  }

  bindResponseGraphDB(response: any) {
    const headers= new HttpHeaders()
      .set('content-type', 'application/rdf+json');

    const config = {
      params: {
        query: `PREFIX : <http://bicaveres.ro#>
SELECT ?hasName ?hasAge ?visitedCity ?country ?dateVisited
WHERE {
    ?user :hasName ?hasName .
    ?user :hasAge ?hasAge .
    ?user :visited ?visited .

    ?visited :visitedCity ?visitedCity ;
             :dateVisited ?dateVisited.

    ?visitedCity :partOf ?country;
}`
      }
    }

    this.http.get('http://localhost:7200/repositories/graph', {'headers': headers, responseType: 'json', params: config.params})
      .subscribe({
        next: (response) => this.displayTableWithResultsFromGraphDB(response),
        error: (error) => console.log(error.message),
      })
  }

  displayTableWithResultsFromGraphDB(response: any) {
    console.log(response.results.bindings)
    this.table3Values = response.results.bindings;
    this.table3Visible = true;
  }

  makeRequestForButton4() {

    const config = {
      params: {
        'default-graph-uri': 'http://dbpedia.org',
        'query': `
PREFIX dbpedia: <http://dbpedia.org/>

SELECT DISTINCT ?film ?budget ?starring
WHERE
     {
        ?film dbo:wikiPageWikiLink dbr:Box_office .
        ?film dbo:budget ?budget .
        ?film dbo:starring ?starring.
      } limit 50`
      }
    }

    this.http.get('https://dbpedia.org/sparql', {params: config.params, responseType: 'json'})
      .subscribe({
        next: (response) => this.displayTable4(response),
        error: (error) => console.log(error.message),
      })
  }

  displayTable4(response:any) {
    this.table4Visible = true;
    this.table4Values = response.results.bindings;
    this.table4Headings = response.head.vars;

    this.insertInServer3(response);
  }

  insertInServer3(response: any) {

  }
}
