import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
//MatTableDataSource stores the table data.
//MatTableModule:  standalone component using Material table.

import { User } from '../../shared/models/user.model';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
// The paginator gives Previous/Next buttons and page size options.
// Imports Material pagination: if you have 100 users, paginator lets user see 5, 10, or 20 at a time.

import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
// MatSort connects sorting to the table headers.
// This is for clicking table headers like ID, Name, or Age to sort.

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
//  API is loading, a spinner can be shown.

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';
// debounceTime waits before searching.
// distinctUntilChanged avoids duplicate searches.
// switchMap cancels the old request and starts a new one.

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-table',
  standalone: true,
  templateUrl: './user-table.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule
  ]
})

export class UserTableComponent implements OnInit, AfterViewInit {

  dashboardStats = [
    {
      label: 'Total Users',
      value: 0,
      note: 'Active user records',
      color: 'from-sky-500 to-blue-600'
    },
    {
      label: 'Total Sales',
      value: 82450,
      note: 'This month revenue',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      label: 'Activities',
      value: 1284,
      note: 'Recent user actions',
      color: 'from-amber-500 to-orange-600'
    }
  ];

  salesData = [
    { month: 'Jan', sales: 12000 },
    { month: 'Feb', sales: 18500 },
    { month: 'Mar', sales: 16000 },
    { month: 'Apr', sales: 24000 },
    { month: 'May', sales: 31000 },
    { month: 'Jun', sales: 38500 }
  ];

  activityData = [
    { label: 'Login', value: 82 },
    { label: 'Orders', value: 64 },
    { label: 'Tickets', value: 38 },
    { label: 'Reviews', value: 51 }
  ];

  displayedColumns: string[] = [
    'id',
    'firstName',
    'email',
    'age'
  ];

  dataSource = new MatTableDataSource<User>();

  total = 0;
  pageSize = 5;
  pageIndex = 0;
  sortActive = '';
  sortDirection = '';

  searchControl = new FormControl(''); 

  isLoading = false;
  errorMessage = '';

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  @ViewChild(MatSort)
  sort!: MatSort;

  constructor(private userService: UserService) {}

  ngOnInit() {

    this.loadUsers();

    this.searchControl.valueChanges.pipe(

      debounceTime(500), //Wait for a short time before executing a function/action.

      distinctUntilChanged(),

      switchMap(value => {

        this.pageIndex = 0;

        return this.fetchUsers();

      })

    ).subscribe((res: any) => this.setTableData(res));

  }

  ngAfterViewInit() {

    this.dataSource.sort = this.sort;

  }

  loadUsers() {

    this.fetchUsers().subscribe((res: any) => this.setTableData(res));

  }

  fetchUsers() {

    this.isLoading = true;
    this.errorMessage = '';
    this.dataSource.data = [];

    return this.userService.getUsers(
      this.pageIndex + 1,
      this.pageSize,
      this.searchControl.value || '',
      this.sortActive,
      this.sortDirection
    ).pipe(
      catchError((error) => {
        console.error('User API failed:', error);
        this.errorMessage = error.status === 429
          ? 'API limit reached. Please wait a few minutes and refresh.'
          : 'Unable to load users from API. Please check your internet connection.';
        return of({ users: [], total: 0 });
      }),
      finalize(() => {
        this.isLoading = false;
      })
    );

  }

  setTableData(res: any) {

    this.dataSource.data = res.users;
    this.total = res.total;
    this.dashboardStats[0].value = res.total;

  }

  get salesChartPoints(): string {

    return this.salesData
      .map((item, index) => {
        const x = this.getSalesPointX(index);
        const y = this.getSalesPointY(item.sales);
        return `${x},${y}`;
      })
      .join(' ');

  }

  getSalesPointX(index: number): number {

    return 20 + index * 52;

  }

  getSalesPointY(sales: number): number {

    return 120 - (sales / this.maxSales) * 90;

  }

  get maxSales(): number {

    return Math.max(...this.salesData.map(item => item.sales));
     // this.salesData.map(item => item.sales) creates
  }

  get maxActivity(): number {

    return Math.max(...this.activityData.map(item => item.value));

  }

  onPageChange(event: any) {

    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();

  }

  onSortChange(sort: Sort) {

    this.sortActive = sort.active;
    this.sortDirection = sort.direction;
    this.pageIndex = 0;
    this.loadUsers();

  }

}
