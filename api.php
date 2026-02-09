<?php
header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/data/schedule.json';
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode(new stdClass(), JSON_PRETTY_PRINT));
}

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function loadData(string $file): array
{
    $contents = file_get_contents($file);
    if ($contents === false || trim($contents) === '') {
        return [];
    }

    $decoded = json_decode($contents, true);
    return is_array($decoded) ? $decoded : [];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $month = $_GET['month'] ?? '';
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        respond(400, ['error' => 'Invalid month format. Use YYYY-MM.']);
    }

    $data = loadData($dataFile);
    $result = [];
    foreach ($data as $date => $status) {
        if (str_starts_with($date, $month . '-')) {
            $result[$date] = $status;
        }
    }

    respond(200, ['month' => $month, 'entries' => $result]);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw ?: '', true);
    if (!is_array($payload)) {
        respond(400, ['error' => 'Invalid JSON payload.']);
    }

    $date = $payload['date'] ?? '';
    $status = $payload['status'] ?? '';
    $allowed = ['full', 'half', 'off', ''];

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        respond(400, ['error' => 'Invalid date format. Use YYYY-MM-DD.']);
    }
    if (!in_array($status, $allowed, true)) {
        respond(400, ['error' => 'Invalid status value.']);
    }

    $data = loadData($dataFile);
    if ($status === '') {
        unset($data[$date]);
    } else {
        $data[$date] = $status;
    }

    if (file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) === false) {
        respond(500, ['error' => 'Failed to save data.']);
    }

    respond(200, ['ok' => true]);
}

respond(405, ['error' => 'Method not allowed.']);
