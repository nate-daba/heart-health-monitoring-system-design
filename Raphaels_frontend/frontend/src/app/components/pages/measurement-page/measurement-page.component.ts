import {Component, OnInit} from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/shared/models/User';

@Component({
  selector: 'app-measurement-page',
  templateUrl: './measurement-page.component.html',
  styleUrls: ['./measurement-page.component.css']
})
export class MeasurementPageComponent {
  user!:User;

  constructor(private userService: UserService) { 
    userService.userObservable.subscribe((newUser) => {
      this.user = newUser;
    })
  }

  ngOnInit() : void {  }
}


