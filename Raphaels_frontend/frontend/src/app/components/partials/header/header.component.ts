import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/shared/models/User';
import { Physician } from 'src/app/shared/models/Physician';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  user!:User;
  physician!:Physician;

  constructor(private userService: UserService) { 
    userService.userObservable.subscribe((newUser) => {
      this.user = newUser;
    })
  }

  ngOnInit() : void {

  }

  logout() {
    this.userService.logout();
  }

  get isAuth() {
    return this.user.token;
  }

  // get physicianIsAuth() {
  //   return this.physician.token;
  // }

}
