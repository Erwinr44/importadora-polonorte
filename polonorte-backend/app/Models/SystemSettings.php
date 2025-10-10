<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'category',
        'type',
        'label',
        'description',
        'is_sensitive'
    ];

    protected $casts = [
        'is_sensitive' => 'boolean',
    ];

    // Encriptar valores sensibles al guardar
    public function setValueAttribute($value)
    {
        if ($this->is_sensitive && !empty($value)) {
            $this->attributes['value'] = Crypt::encryptString($value);
        } else {
            $this->attributes['value'] = $value;
        }
    }

    // Desencriptar valores sensibles al leer
    public function getValueAttribute($value)
    {
        if ($this->is_sensitive && !empty($value)) {
            try {
                return Crypt::decryptString($value);
            } catch (\Exception $e) {
                return null;
            }
        }
        return $value;
    }

    // Método helper para obtener valor por key
    public static function getValue($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    // Método helper para establecer valor
    public static function setValue($key, $value)
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    // Obtener todas las configuraciones por categoría
    public static function getByCategory($category)
    {
        return self::where('category', $category)->get();
    }
}