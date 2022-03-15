import {Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import {catchError, Observable, switchMap, throwError} from 'rxjs';
import {AppService} from '../app.service';
import {environment} from "../../environments/environment";
import {GeneralService} from "../general.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  static accessToken = '';

  refresh: boolean = false;

  public headers = new HttpHeaders();

  constructor(private authService: AppService, private http: HttpClient) {}


  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const req = request.clone({
      setHeaders: {
        Authorization: `Bearer ${AuthInterceptor.accessToken}`,
      }
    })

    return next.handle(req).pipe(catchError((err: HttpErrorResponse) => {
      if (err.status == 401 && !this.refresh) {
        this.refresh = true
        let queryParams = new HttpParams();
        queryParams = queryParams.set('access_token', sessionStorage.getItem('token')!);
        const refreshHeader = new HttpHeaders()
          .set('Access-Control-Allow-Origin', '*')
          .set('App-Secret', environment.app_secret)
          .set('Platform', environment.platform)
          .set('Accept', environment.accept)
          .set('Authorization', 'Bearer ' + sessionStorage.getItem('refresh_token'));

        return this.http.get('https://phplaravel-718120-2386003.cloudwaysapps.com/api/v1/auth/refresh', {
          params: queryParams,
          "headers": refreshHeader
        }).pipe(
          switchMap((res: any) => {
            AuthInterceptor.accessToken = res.data.access_token;
            return next.handle(request.clone(
              {
                setHeaders: {
                  Authorization: `Bearer ${AuthInterceptor.accessToken}`
                }
              }
            ))
          })
        )
      }
      this.refresh = false;
      return throwError(() => err)
    }));
  }
}
