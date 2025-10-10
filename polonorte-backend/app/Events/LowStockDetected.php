<?php

namespace App\Events;

use App\Models\Product;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LowStockDetected
{
    use Dispatchable, SerializesModels;

    public $product;
    public $currentStock;

    public function __construct(Product $product, $currentStock)
    {
        $this->product = $product;
        $this->currentStock = $currentStock;
    }
}