import { Component, OnInit, Injector, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from './login/login.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppUiCustomizationService } from '@shared/common/ui/app-ui-customization.service';


@Component({
    selector: ".m-grid.m-grid--hor.m-grid--root.m-page",
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class AccountComponent extends AppComponentBase implements OnInit {

    public constructor(
        injector: Injector,
        private _router: Router,
        private _loginService: LoginService,
        private _uiCustomizationService: AppUiCustomizationService
    ) {
        super(injector);
    }


    useFullWidthLayout(): boolean {
        return this._router.url.indexOf('/account/select-edition') >= 0;
    }


    ngOnInit(): void {

        this._loginService.init();
        $('body').attr('class', this._uiCustomizationService
                       .getAccountModuleBodyClass());
    }
}
