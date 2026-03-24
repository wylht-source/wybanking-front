import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AccountService } from './account.service';
import { environment } from '../../../environments/environment';

describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AccountService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts account creation requests to the accounts endpoint', () => {
    service.createAccount({ ownerName: 'Serge Junior' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/accounts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ ownerName: 'Serge Junior' });
    req.flush({});
  });

  it('gets the current user account from the me endpoint', () => {
    service.getMyAccount().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/accounts/me`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('gets a specific account by id', () => {
    service.getAccount('account-1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/accounts/account-1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('gets account statements with paging params', () => {
    service.getStatement('account-1', 3, 15).subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/accounts/account-1/statement?page=3&pageSize=15`,
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], totalCount: 0, page: 3, pageSize: 15 });
  });
});
