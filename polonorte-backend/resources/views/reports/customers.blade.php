<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reporte de Clientes</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; color: #333; }
        .summary { margin: 20px 0; background: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; }
        .summary-item .label { font-weight: bold; color: #666; }
        .summary-item .value { font-size: 18px; color: #333; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #333; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>IMPORTADORA POLONORTE</h1>
        <h2>Reporte de Clientes</h2>
        <p>Período: {{ $data->period->from }} - {{ $data->period->to }}</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="label">Total Clientes</div>
            <div class="value">{{ $data->summary->total_customers }}</div>
        </div>
    </div>

    <h3>Top 10 Clientes por Monto</h3>
    <table>
        <thead>
            <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Pedidos</th>
                <th>Total Gastado</th>
                <th>Ticket Promedio</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data->top_customers as $customer)
            <tr>
                <td>{{ $customer->customer_name }}</td>
                <td>{{ $customer->customer_phone }}</td>
                <td>{{ $customer->total_orders }}</td>
                <td>Q{{ number_format($customer->total_spent, 2) }}</td>
                <td>Q{{ number_format($customer->avg_ticket, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>Generado el {{ now()->format('d/m/Y H:i') }} - Importadora Polonorte</p>
    </div>
</body>
</html>