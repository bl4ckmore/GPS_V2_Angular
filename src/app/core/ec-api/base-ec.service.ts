import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BaseEcService {
  protected base = environment.EC_API_BASE;
  constructor(protected http: HttpClient) {}
}
