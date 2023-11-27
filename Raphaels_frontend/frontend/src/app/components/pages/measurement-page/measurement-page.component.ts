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

    //search the device for the given user
  }

  // Nate's code to get values from MongoDB to populate table:
  $:any(document).ready(function() {
    // Retrieve 'deviceId' from local storage
    var comingFrom = localStorage.getItem('comingFrom');
    
    if (comingFrom === 'login') {
        $('.success-message h2').text('Sensor Data');
    } else if (comingFrom === 'deviceRegistration') {
        $('.success-message h2').text('Device Registered Successfully');
    }
    
    // Clear the item to avoid affecting subsequent visits to the page
    localStorage.removeItem('comingFrom');
    
    let deviceId = localStorage.getItem("deviceId");

      $.ajax({
          url: '/sensorData/read',
          method: 'GET',
          headers: {
              'x-auth': window.localStorage.getItem("token") // Assuming token is stored in localStorage
          },
          dataType: 'json',
          contentType: 'application/json',
          data: { deviceId: deviceId }, // Data is sent as query parameters for GET requests
      })
      .done(function(response) {
          // Assuming the response is an array of data objects
          console.log(response);
          response.forEach(function(data) {
              var row = $('<tr>').append(
                  $('<td>').text(data.deviceId),
                  $('<td>').text(data.data.heartrate),
                  $('<td>').text(data.data.spo2),
                  $('<td>').text(new Date(data.published_at).toLocaleString()) // Formatting timestamp
              );
              $('#dataBody').append(row);
          });
      })
      .fail(function(jqXHR, textStatus) {
          // Handle any error that occurred during the AJAX call
          console.error('Error fetching data: ' + textStatus);
      });
  });
}


