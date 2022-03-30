import { Router, ActivatedRoute } from '@angular/router';
import { AppConfig } from './../app.config';
import { User } from './../models/user.model';
import { AuthService } from './../services/auth.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UpdateHeaderService } from './../services/update-header.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login-sala-controle',
  templateUrl: './login-sala-controle.component.html',
})
export class LoginSalaControleComponent implements OnInit {

  loading_autenticar = false;

  loginForm: FormGroup;
  authenticatedUser: User = null;
  version;

  constructor(
    private updateHeaderService: UpdateHeaderService,
    private authService: AuthService,
    private config: AppConfig,
    private router: Router,
    private activatedRouter: ActivatedRoute
  ) {

  }

  ngOnInit(): void {
    this.updateHeaderService.hiddenSidebarHeader();

    this.version = `v${this.config.VERSION}`;

    this.loginForm = new FormGroup({
      username: new FormControl(null, Validators.required),
      password: new FormControl(null, Validators.required)
    });
  }

  login() {
    this.loading_autenticar = true;

    this.authService.login(this.loginForm.getRawValue()).subscribe(
      res => {
        this.authService.setUserSession(res['user'].username);
        this.authService.setAuthorizationToken(res['token']);
        this.authenticatedUser = res['user'];

        this.activatedRouter.queryParams.subscribe(data => {
          if (Object.keys(data).length > 0) {
            this.router.navigateByUrl(data['next'])
              .catch(error => {
                console.log(error)
                this.router.navigate(['dashboard']);
              });

          } else {
            this.router.navigate(['dashboard']);
          }
        });
      },
      error => {
        if (error.status === 400) {
          this.loginForm.setErrors(error.error['non_field_errors'][0]);
        } else {
          console.log(error);
          this.loginForm.setErrors(['Erro interno da aplicação']);
        }
        this.loading_autenticar = false;

      }
    );
    }

}
