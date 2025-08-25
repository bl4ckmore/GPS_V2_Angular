import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoriesService, Category } from '../../../core/ec-api/categories.service';

@Component({
  selector: 'app-categories-page',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesPage implements OnInit {
  cols = ['id', 'name', 'actions'];
  rows: Category[] = [];
  loading = false;

  form = this.fb.group({
    id: [0],
    name: ['', Validators.required]
  });

  editing = false;

  constructor(private fb: FormBuilder, private api: CategoriesService, private snack: MatSnackBar) {}

  ngOnInit(){ this.refresh(); }

  refresh() {
    this.loading = true;
    this.api.list().subscribe({
      next: d => this.rows = d,
      error: () => this.snack.open('Failed to load categories', 'Close', { duration: 2500 }),
      complete: () => this.loading = false
    });
  }

  edit(r: Category){ this.editing = true; this.form.patchValue(r); }
  cancel(){ this.editing = false; this.form.reset({ id:0, name:'' }); }

  save(){
    if (this.form.invalid) return;
    const dto = this.form.value as Partial<Category>;
    const req = dto.id && dto.id>0 ? this.api.update(dto.id, dto) : this.api.create(dto);
    req.subscribe({
      next: () => { this.snack.open(this.editing?'Category updated':'Category created','OK',{duration:2000}); this.cancel(); this.refresh(); },
      error: () => this.snack.open('Save failed', 'Close', { duration: 2500 })
    });
  }

  remove(r: Category){
    if (!confirm(`Delete category #${r.id}?`)) return;
    this.api.delete(r.id).subscribe({
      next: () => { this.snack.open('Category deleted','OK',{duration:2000}); this.refresh(); },
      error: () => this.snack.open('Delete failed', 'Close', { duration: 2500 })
    });
  }
}
