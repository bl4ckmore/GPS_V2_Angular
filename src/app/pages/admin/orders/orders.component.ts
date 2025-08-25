import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrdersService, Order } from '../../../core/ec-api/orders.service';
@Component({
  selector: 'app-orders-page',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersPage implements OnInit {
  cols = ['id', 'customerName', 'totalAmount'];
  rows: Order[] = [];
  loading = false;

  form = this.fb.group({
    customerName: ['', Validators.required],
    totalAmount: [0, [Validators.required, Validators.min(0)]]
  });

  constructor(private fb: FormBuilder, private api: OrdersService, private snack: MatSnackBar) {}

  ngOnInit(){ this.refresh(); }

  refresh(){
    this.loading = true;
    this.api.list().subscribe({
      next: d => this.rows = d,
      error: () => this.snack.open('Failed to load orders','Close',{duration:2500}),
      complete: () => this.loading = false
    });
  }

 create(){
  if (this.form.invalid) return;
  const dto = this.form.getRawValue() as Partial<Order>;

  this.api.create(dto).subscribe({
    next: () => {
      this.snack.open('Order created','OK',{duration:2000});
      this.form.reset({ customerName:'', totalAmount:0 });
      this.refresh();
    },
    error: () => this.snack.open('Create failed','Close',{duration:2500})
  });
}
}
