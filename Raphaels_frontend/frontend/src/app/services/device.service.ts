// TODO: this file can be slimmed down significantly since we shouldn't 
// need to save the device in local storage on the user's computer

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Device } from '../shared/models/Device';
import { HttpClient } from '@angular/common/http';
import { DEVICE_REGISTER_URL } from '../shared/constants/urls';
import { ToastrService } from 'ngx-toastr';
import { IDeviceRegister } from '../shared/interfaces/IDeviceRegister';

const DEVICE_KEY = 'Device';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private deviceSubject = new BehaviorSubject<Device>(this.getDeviceFromLocalStorage());
  public deviceObservable:Observable<Device>; // read-only
  constructor(private http:HttpClient, private toastrService:ToastrService) {
    this.deviceObservable = this.deviceSubject.asObservable();
  }

  register(deviceRegister: IDeviceRegister): Observable<Device>{
    return this.http.post<Device>(DEVICE_REGISTER_URL, deviceRegister).pipe(
      tap({
        next: (device) => {
          this.setDeviceToLocalStorage(device); // TODO: this might not be needed
          this.deviceSubject.next(device);
          this.toastrService.success(
            `Your device was registered successfully!`
          )
        },
        error: (errorResponse) => {
          this.toastrService.error(errorResponse.error,
            'Registration Failed')
        }
      })
    )
  }
  // TODO: this might not be needed:
  private setDeviceToLocalStorage(device:Device) {
    localStorage.setItem(DEVICE_KEY, JSON.stringify(device));
  }

  private getDeviceFromLocalStorage(): Device {
    const deviceJson = localStorage.getItem(DEVICE_KEY);
    if(deviceJson) {
      const currentDevice = JSON.parse(deviceJson) as Device;
      return currentDevice;
    }
    return new Device();
  }
}

