import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, NgForm} from "@angular/forms";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

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

  constructor(public fb: FormBuilder, private http: HttpClient) {
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
      dov: ['']
    });
  }

  submitForm() {
    const id =  parseInt(this.myForm.value.user);
    console.log(id);
    const data =  {
      "city_name": this.myForm.value.oras,
      "country_name": this.myForm.value.tara,
      "date_visited": this.myForm.value.dov
    }

    // users/1
    this.http.post('http://localhost:4000/users/1/cities', data)
      .subscribe({
        next: (response) => this.users = response,
        error: (error) => console.log(error),
      })

    this.http.get('http://localhost:4000/users?_embed=cities')
      .subscribe({
        next: (response) => this.bindResponse(response),
        error: (error) => console.log(error),
      })
  }

  bindResponse(response: any) {
    this.users = response;
    this.tableVisible = true;
    this.button2Enabled = true;
  }

  insertTableValuesInServer2() {
    console.log(this.users)
  }
}
