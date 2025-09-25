<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderTracking extends Model
{
    use HasFactory;

    protected $table = 'order_tracking';

    protected $fillable = ['order_id', 'status', 'notes', 'updated_by'];

    // Relación con orden
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    // Relación con el usuario que actualizó
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}