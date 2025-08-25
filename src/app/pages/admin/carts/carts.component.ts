import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartsService, Cart } from '../../../core/ec-api/carts.service';

@Component({
  selector: 'app-carts-page',
  templateUrl: './carts.component.html',
  styleUrls: ['./carts.component.scss']
})
export class CartsPage implements OnInit {
  cols = ['id', 'userId', 'productId', 'quantity', 'actions'];
  rows: Cart[] = [];
  loading = false;

  form = this.fb.group({
    userId: [0, Validators.required],
    productId: [0, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

  constructor(private fb: FormBuilder, private api: CartsService, private snack: MatSnackBar) {}

  ngOnInit(){ this.refresh(); }

  refresh(){
    this.loading = true;
    this.api.list().subscribe({
      next: d => this.rows = d,
      error: () => this.snack.open('Failed to load carts','Close',{duration:2500}),
      complete: () => this.loading = false
    });
  }

  create(){
  if (this.form.invalid) return;
  const dto = this.form.getRawValue() as Partial<Cart>;

  this.api.create(dto).subscribe({
    next: () => {
      this.snack.open('Cart created','OK',{duration:2000});
      this.form.reset({ userId:0, productId:0, quantity:1 });
      this.refresh();
    },
    error: () => this.snack.open('Create failed','Close',{duration:2500})
  });
}

  remove(row: Cart){
    if (!confirm(`Remove cart #${row['id']}?`)) return;
    this.api.delete((row as any).id).subscribe({
      next: () => { this.snack.open('Cart deleted','OK',{duration:2000}); this.refresh(); },
      error: () => this.snack.open('Delete failed','Close',{duration:2500})
    });
  }
}
