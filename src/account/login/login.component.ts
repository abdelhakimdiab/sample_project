import { Component, Injector, OnInit } from '@angular/core';
import {
    SessionServiceProxy,
    UpdateUserSignInTokenOutput,
    AccountServiceProxy,
    CurrentTenantInfoDto
} from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LoginService, ExternalLoginProvider } from './login.service';
import { accountModuleAnimation } from '@shared/animations/routerTransition';
import { AbpSessionService } from '@abp/session/abp-session.service';
import { UrlHelper } from 'shared/helpers/UrlHelper';
import {AppConsts} from '@shared/AppConsts';


enum LoginWizardStep {
    Email,
    Tenant,
    Password
}


@Component({
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    animations: [accountModuleAnimation()]
})
export class LoginComponent extends AppComponentBase implements OnInit {

    public LoginWizardStep = LoginWizardStep;
    public loginWizardStep: LoginWizardStep = LoginWizardStep.Email;
    public shouldAskForTenantName: boolean;
    public availableTenants = [];
    public invalidEmail = false;
    public submitting = false;


    public _selectedTenant: CurrentTenantInfoDto;

    set selectedTenant(tenantInfo: CurrentTenantInfoDto) {
        this._selectedTenant = tenantInfo;
        this.loginService.authenticateModel.tenantName =
            tenantInfo.tenancyName;
    }

    get selectedTenant() {
        return this._selectedTenant;
    }


    constructor(
        injector: Injector,
        public loginService: LoginService,
        public _sessionService: AbpSessionService,
        private _sessionAppService: SessionServiceProxy,
        private accountService: AccountServiceProxy
    ) {
        super(injector);
    }


    ngOnInit() {

        if (this._sessionService.userId > 0 &&
            UrlHelper.getReturnUrl() &&
            UrlHelper.getSingleSignIn()) {
            this._sessionAppService.updateUserSignInToken()
                .subscribe((result: UpdateUserSignInTokenOutput) => {
                    const initialReturnUrl = UrlHelper.getReturnUrl();
                    const returnUrl = initialReturnUrl +
                        (initialReturnUrl.indexOf('?') >= 0 ? '&' : '?') +
                        'accessToken=' + result.signInToken +
                        '&userId=' + result.encodedUserId +
                        '&tenantId=' + result.encodedTenantId;

                    location.href = returnUrl;
                });
        }

        // TODO: explain this mess
        this.shouldAskForTenantName = abp.multiTenancy.isEnabled &&
            ((AppConsts.tenancyName &&
              AppConsts.tenancyName.toLowerCase() === 'app') ||
             !(AppConsts.appBaseUrlFormat &&
               AppConsts.appBaseUrlFormat
               .indexOf(AppConsts.tenancyNamePlaceHolderInUrl) >= 0));

        if (!this.shouldAskForTenantName) {
            this.loginService.authenticateModel.tenantName =
            AppConsts.tenancyName;
        }

    }


    public login() {
        this.submitting = true;
        this.loginService.authenticate(
            () => this.submitting = false
        );
    }


    public submitUsernameOrEmail() {
        if (!this.shouldAskForTenantName) {
            // We already have the `tenantId` cookie set here in the
            // bootstrap process
            this.loginWizardStep = LoginWizardStep.Password;
            return false; // prevent default form submission
        }

        this.accountService
            .getActiveTenantsByEmailAsync(this.loginService.authenticateModel
                                          .userNameOrEmailAddress)
            .subscribe(response => {

                if (response.length > 0) {
                    this.availableTenants = response;
                    this.selectedTenant = this.availableTenants[0];
                    this.invalidEmail = false;

                    if (this.availableTenants.length === 1) {
                        // We don't have the `tenantId` cookie here,
                        // so we request and set it.
                        this.accountService
                            .isTenantAvailable(this.availableTenants[0])
                            .subscribe(response => {
                                abp.multiTenancy.setTenantIdCookie(response.tenantId);
                                this.loginWizardStep = LoginWizardStep.Password;
                            });
                    } else {
                        this.loginWizardStep = LoginWizardStep.Tenant;
                    }
                } else {
                    this.invalidEmail = true;
                }
            });

        return false; // prevent default form submission
    }

    public submitTenant() {
        // We don't have the `tenantId` cookie here,
        // so we request and set it.
        this.accountService
            .isTenantAvailable(this.selectedTenant)
            .subscribe(response => {
                abp.multiTenancy.setTenantIdCookie(response.tenantId);
                this.loginWizardStep = LoginWizardStep.Password;
            });

        return false; // prevent default form submission
    }


    public backToEmailStep() {
        this.loginWizardStep = LoginWizardStep.Email;
    }

    public backToTenantStep() {
        this.loginWizardStep = LoginWizardStep.Tenant;
    }

    public externalLogin(provider: ExternalLoginProvider) {
        this.loginService.externalAuthenticate(provider);
    }

    public setTenant(tenancyName: string) {
        this.selectedTenant = this.availableTenants
            .find(tenant => tenant.tenancyName === tenancyName);
    }

}
