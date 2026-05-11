import { Injectable } from '@angular/core';
import { HttpClient,HttpParams } from '@angular/common/http';  
// HttpClient: used to make API requests.
// HttpParams is used to build query parameters for the API URL, like results, page, seed, etc.


import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})

export class UserService {

  private api = 'https://randomuser.me/api/';
  private totalUsers = 100;
// private means this variable should only be used inside this service class.

  constructor(private http: HttpClient) { } // this.http.get(...)  service call


  getUsers(page: number, limit: number, search: string, sort: string, order: string): Observable<any> {

    const query = search.trim().toLowerCase();
    const results = sort || query ? this.totalUsers : limit;

    const params = new HttpParams()
      .set('results', results)  // this random user Api how many users to return
      .set('page', sort || query ? 1 : page)  // searching request page 1 , if not seaching request in current page 
      .set('seed', 'user-table') //The seed makes the API return consistent users for the same page/results combination.
      .set('inc', 'name,email,dob');  // Api to include only these fields

    return this.http.get<any>(this.api, { params }).pipe(
      map(response => {
        let users: User[] = response.results.map((item: any, index: number) => ({
          id: query ? index + 1 : (page - 1) * limit + index + 1,
          firstName: item.name.first,
          lastName: item.name.last,
          email: item.email,
          age: item.dob.age 
        }));

        users = users.filter(user => 
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );

        if (sort && order) {
          users = this.sortUsers(users, sort as keyof User, order);
        }

        const start = sort || query ? (page - 1) * limit : 0;
        const pagedUsers = sort || query ? users.slice(start, start + limit) : users;

        return {
          users: pagedUsers,
          total: query ? users.length : this.totalUsers
        };
      })
    );
  }

  private sortUsers(users: User[], sort: keyof User, order: string): User[] {

    return [...users].sort((a, b) => {
      const firstValue = a[sort];
      const secondValue = b[sort];

      const comparison = typeof firstValue === 'number' && typeof secondValue === 'number'
        ? firstValue - secondValue
        : String(firstValue).localeCompare(String(secondValue));  // localeCompare() is used for string sorting.

      return order === 'asc' ? comparison : -comparison;
    });

  }
}
