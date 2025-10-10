<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte de Ventas</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            color: #333;
        }
        .summary {
            margin: 20px 0;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
        }
        .summary-item {
            display: inline-block;
            width: 30%;
            text-align: center;
            margin: 10px;
        }
        .summary-item .label {
            font-weight: bold;
            color: #666;
        }
        .summary-item .value {
            font-size: 18px;
            color: #333;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background: #333;
            color: white;
            padding: 10px;
            text-align: left;
        }
        td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background: #f9f9f9;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>IMPORTADORA POLONORTE</h1>
        <h2>Reporte de Ventas</h2>
        <p>Período: {{ $data->period->from }} - {{ $data->period->to }}</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="label">Total Ventas</div>
            <div class="value">Q{{ number_format($data->summary->total_sales, 2) }}</div>
        </div>
        <div class="summary-item">
            <div class="label">Total Pedidos</div>
            <div class="value">{{ $data->summary->total_orders }}</div>
        </div>
        <div class="summary-item">
            <div class="label">Ticket Promedio</div>
            <div class="value">Q{{ number_format($data->summary->average_ticket, 2) }}</div>
        </div>
    </div>

    <h3>Top 10 Productos Más Vendidos</h3>
    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Total Ventas</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data->top_products as $product)
            <tr>
                <td>{{ $product->code }}</td>
                <td>{{ $product->name }}</td>
                <td>{{ $product->total_quantity }}</td>
                <td>Q{{ number_format($product->total_sales, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Generado el {{ now()->format('d/m/Y H:i') }} - Importadora Polonorte</p>
    </div>
</body>
</html>