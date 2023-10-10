import {Component, OnInit} from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/shared/models/User';

@Component({
  selector: 'app-heart-rate-page',
  templateUrl: './heart-rate-page.component.html',
  styleUrls: ['./heart-rate-page.component.css']
})
export class HeartRatePageComponent {
  user!:User;

  constructor(private userService: UserService) { 
    userService.userObservable.subscribe((newUser) => {
      this.user = newUser;
    })
  }

  ngOnInit() : void {  }
}


