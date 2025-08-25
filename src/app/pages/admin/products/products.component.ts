import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductsService, Product } from '../../../core/ec-api/products.service';

@Component({
  selector: 'app-products-page',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsPage implements OnInit {
  cols = ['id', 'name', 'price', 'actions'];
  rows: Product[] = [];
  loading = false;

  form = this.fb.group({
    id: [0],
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    description: ['']
  });

  editing = false;

  constructor(
    private fb: FormBuilder,
    private api: ProductsService,
    private snack: MatSnackBar
  ) {}

  ngOnInit() { this.refresh(); }

  refresh() {
    this.loading = true;
    this.api.list().subscribe({
      next: (data) => this.rows = data,
      error: () => this.snack.open('Failed to load products', 'Close', { duration: 2500 }),
      complete: () => this.loading = false
    });
  }

  edit(row: Product) {
    this.editing = true;
    this.form.patchValue(row);
  }

  cancel() {
    this.editing = false;
    this.form.reset({ id: 0, name: '', price: 0, description: '' });
  }

  save() {
    if (this.form.invalid) return;
    const dto = this.form.value as Partial<Product>;
    const req = dto.id && dto.id > 0
      ? this.api.update(dto.id, dto)
      : this.api.create(dto);

    req.subscribe({
      next: () => {
        this.snack.open(this.editing ? 'Product updated' : 'Product created', 'OK', { duration: 2000 });
        this.cancel(); this.refresh();
      },
      error: () => this.snack.open('Save failed', 'Close', { duration: 2500 })
    });
  }

  remove(row: Product) {
    if (!confirm(`Delete product #${row.id}?`)) return;
    this.api.delete(row.id).subscribe({
      next: () => { this.snack.open('Product deleted', 'OK', { duration: 2000 }); this.refresh(); },
      error: () => this.snack.open('Delete failed', 'Close', { duration: 2500 })
    });
  }
}
