import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent implements OnInit {

  // "!" means it's required; html forms element refers to it
  loginForm!:FormGroup; // an angular prebuilt from Angular Forms
  isSubmitted = false;
  returnUrl = '';
  
  constructor(private formBuilder: FormBuilder, 
    private userService: UserService, 
    private activatedRout: ActivatedRoute,
    private router: Router) { }
    
  ngOnInit() : void {
    this.loginForm = this.formBuilder.group({
      email:['', [Validators.required, Validators.email]], // adding validators
      password:['', Validators.required]
    });
    // loginForm.controls.email to access user input (?)
    this.returnUrl = this.activatedRout.snapshot.queryParams['returnUrl'] // snapshot = latest value of activated route (doesn't need to subscribe to it)
    // queryParams are everything after the '?', e.g. '?returnUrl=/checkout
  }

  get fc() {// getter to shorten the user input reference
    return this.loginForm.controls;
  }

  submit(){
    this.isSubmitted = true;

    if(this.loginForm.invalid) return;
    // alert(`email: ${this.fc['email'].value},
    //   password: ${this.fc['password'].value}`) // to be deleted

    // alert(`In submit() of LoginPageComponent, email: ${this.fc['email'].value} and pw: ${this.fc['password'].value}`);
    this.userService.login({email:this.fc['email'].value,
      password: this.fc['password'].value}).subscribe(() => {
        // this.router.navigateByUrl(this.returnUrl);
        this.router.navigateByUrl('/measurements');
      });
  }
}
