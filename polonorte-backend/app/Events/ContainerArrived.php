<?php

namespace App\Events;

use App\Models\Container;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContainerArrived
{
    use Dispatchable, SerializesModels;

    public $container;

    public function __construct(Container $container)
    {
        $this->container = $container;
    }
}