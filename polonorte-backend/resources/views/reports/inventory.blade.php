<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte de Inventario</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; color: #333; }
        .summary { margin: 20px 0; background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .summary-item { display: inline-block; width: 22%; text-align: center; margin: 5px; }
        .summary-item .label { font-weight: bold; color: #666; font-size: 10px; }
        .summary-item .value { font-size: 16px; color: #333; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #333; color: white; padding: 10px; text-align: left; font-size: 11px; }
        td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 11px; }
        tr:nth-child(even) { background: #f9f9f9; }
        .alert { background: #fff3cd; padding: 3px 6px; border-radius: 3px; color: #856404; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>IMPORTADORA POLONORTE</h1>
        <h2>Reporte de Inventario</h2>
        <p>Generado: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="label">Total Productos</div>
            <div class="value">{{ $data->summary->total_products }}</div>
        </div>
        <div class="summary-item">
            <div class="label">Bodegas</div>
            <div class="value">{{ $data->summary->total_warehouses }}</div>
        </div>
        <div class="summary-item">
            <div class="label">Valor Inventario</div>
            <div class="value">Q{{ number_format($data->summary->total_inventory_value, 2) }}</div>
        </div>
        <div class="summary-item">
            <div class="label">Alertas Stock Bajo</div>
            <div class="value" style="color: #dc3545;">{{ $data->summary->low_stock_count }}</div>
        </div>
    </div>

    <h3>Productos con Stock Bajo</h3>
    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Diferencia</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data->low_stock_products as $product)
            <tr>
                <td>{{ $product['code'] }}</td>
                <td>{{ $product['name'] }}</td>
                <td><span class="alert">{{ $product['current_stock'] }}</span></td>
                <td>{{ $product['min_stock'] }}</td>
                <td style="color: #dc3545;">{{ $product['difference'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Generado el {{ now()->format('d/m/Y H:i') }} - Importadora Polonorte</p>
    </div>
</body>
</html>