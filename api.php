<?php
header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/data/schedule.json';

function ensureDataFile($file)
{
    $directory = dirname($file);
    if (!is_dir($directory) && !mkdir($directory, 0777, true) && !is_dir($directory)) {
        return false;
    }

    if (!file_exists($file)) {
        return file_put_contents($file, json_encode(new stdClass(), JSON_PRETTY_PRINT), LOCK_EX) !== false;
    }

    return true;
}

function respond($status, $payload)
{
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function normalizeStatus($status)
{
    if (!is_string($status)) {
        return null;
    }

    $normalized = strtolower(trim($status));

    $map = [
        '' => '',
        'full' => 'full',
        'fullday' => 'full',
        'full day' => 'full',
        'full-day' => 'full',
        'half' => 'half',
        'halfday' => 'half',
        'half day' => 'half',
        'half-day' => 'half',
        'off' => 'off',
        'dayoff' => 'off',
        'day off' => 'off',
        'day-off' => 'off',
    ];

    return isset($map[$normalized]) ? $map[$normalized] : null;
}

function normalizeAndreas($value)
{
    if (is_bool($value)) {
        return $value;
    }

    if (is_int($value)) {
        return $value === 1;
    }

    if (is_string($value)) {
        $normalized = strtolower(trim($value));
        $truthy = ['1', 'true', 'yes', 'on'];
        $falsy = ['0', 'false', 'no', 'off', ''];
        if (in_array($normalized, $truthy, true)) {
            return true;
        }
        if (in_array($normalized, $falsy, true)) {
            return false;
        }
    }

    return null;
}

function normalizeEntry($entry)
{
    $result = [
        'status' => '',
        'andreas' => false,
    ];

    if (is_string($entry)) {
        $status = normalizeStatus($entry);
        if ($status !== null) {
            $result['status'] = $status;
        }
        return $result;
    }

    if (!is_array($entry)) {
        return $result;
    }

    if (array_key_exists('status', $entry)) {
        $status = normalizeStatus($entry['status']);
        if ($status !== null) {
            $result['status'] = $status;
        }
    }

    if (array_key_exists('andreas', $entry)) {
        $andreas = normalizeAndreas($entry['andreas']);
        if ($andreas !== null) {
            $result['andreas'] = $andreas;
        }
    }

    return $result;
}

function loadData($file)
{
    if (!ensureDataFile($file)) {
        return null;
    }

    $contents = file_get_contents($file);
    if ($contents === false || trim($contents) === '') {
        return [];
    }

    $decoded = json_decode($contents, true);
    if (!is_array($decoded)) {
        return [];
    }

    $clean = [];
    foreach ($decoded as $date => $entry) {
        if (!is_string($date)) {
            continue;
        }

        $normalizedEntry = normalizeEntry($entry);
        if ($normalizedEntry['status'] !== '' || $normalizedEntry['andreas']) {
            $clean[$date] = $normalizedEntry;
        }
    }

    return $clean;
}

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

if ($method === 'GET') {
    $month = isset($_GET['month']) ? $_GET['month'] : '';
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        respond(400, ['error' => 'Invalid month format. Use YYYY-MM.']);
    }

    $data = loadData($dataFile);
    if ($data === null) {
        respond(500, ['error' => 'Failed to initialize data file.']);
    }

    $result = [];
    foreach ($data as $date => $entry) {
        if (strpos($date, $month . '-') === 0) {
            $result[$date] = $entry;
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

    $date = isset($payload['date']) ? $payload['date'] : '';
    $statusProvided = array_key_exists('status', $payload);
    $andreasProvided = array_key_exists('andreas', $payload);

    if (!$statusProvided && !$andreasProvided) {
        respond(400, ['error' => 'No fields provided to update.']);
    }

    $status = $statusProvided ? normalizeStatus($payload['status']) : null;
    $andreas = $andreasProvided ? normalizeAndreas($payload['andreas']) : null;

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        respond(400, ['error' => 'Invalid date format. Use YYYY-MM-DD.']);
    }
    if ($statusProvided && $status === null) {
        respond(400, ['error' => 'Invalid status value.']);
    }
    if ($andreasProvided && $andreas === null) {
        respond(400, ['error' => 'Invalid Andreas value.']);
    }

    $data = loadData($dataFile);
    if ($data === null) {
        respond(500, ['error' => 'Failed to initialize data file.']);
    }

    $existing = isset($data[$date]) ? normalizeEntry($data[$date]) : ['status' => '', 'andreas' => false];

    if ($statusProvided) {
        $existing['status'] = $status;
    }
    if ($andreasProvided) {
        $existing['andreas'] = $andreas;
    }

    if ($existing['status'] === '' && !$existing['andreas']) {
        unset($data[$date]);
    } else {
        $data[$date] = $existing;
    }

    if (file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX) === false) {
        respond(500, ['error' => 'Failed to save data.']);
    }

    respond(200, ['ok' => true]);
}

respond(405, ['error' => 'Method not allowed.']);
