import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceService } from 'src/app/services/device.service';
import { IDeviceRegister } from 'src/app/shared/interfaces/IDeviceRegister';

@Component({
  selector: 'app-register-device-page',
  templateUrl: './register-device-page.component.html',
  styleUrls: ['./register-device-page.component.css']
})
export class RegisterDevicePageComponent implements OnInit {

  registerForm!: FormGroup;
  isSubmitted = false;

  returnUrl = '';
  constructor(
    private formBuilder: FormBuilder,
    private deviceService: DeviceService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void{
    this.registerForm = this.formBuilder.group({
      deviceId: ['', [Validators.required, Validators.minLength(1)]], // empty by default, required, and min 1 chars
      email: ['', [Validators.required, Validators.email]]
    },{
      //validators: PasswordsMatchValidator('password', 'confirmPassword')
    });

    this.returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'];
  }

  get fc() {
    return this.registerForm.controls;
  }

  submit() {
    this.isSubmitted = true;
    if (this.registerForm.invalid) return;

    const fv = this.registerForm.value; // fv = form values
    const device : IDeviceRegister = {
      deviceId: fv.deviceId,
      email: fv.email
    };

    this.deviceService.register(device).subscribe(_ => {
      // this.router.navigateByUrl(this.returnUrl);
      this.router.navigateByUrl('/measurements');
    }) // don't care about the subscribe input parameter, so just put a '_'
  }

}
