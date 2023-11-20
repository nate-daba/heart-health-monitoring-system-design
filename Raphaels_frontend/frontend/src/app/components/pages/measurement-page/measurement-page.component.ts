import {Component, OnInit} from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/shared/models/User';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-measurement-page',
  templateUrl: './measurement-page.component.html',
  styleUrls: ['./measurement-page.component.css']
})
export class MeasurementPageComponent implements OnInit {
  
  user!:User;
  returnUrl = '';

  constructor(private userService: UserService, 
    private activatedRout: ActivatedRoute,
    private router: Router) {
      userService.userObservable.subscribe((newUser) => {
        this.user = newUser;
      })
    }


  ngOnInit() : void {
    this.returnUrl = this.activatedRout.snapshot.queryParams['returnUrl'] // snapshot = latest value of activated route (doesn't need to subscribe to it)
    // queryParams are everything after the '?', e.g. '?returnUrl=/checkout
  }
}


