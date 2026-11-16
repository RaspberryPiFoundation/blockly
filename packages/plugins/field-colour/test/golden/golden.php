function colour_random() {
  return '#' . str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT);
}

function colour_rgb($r, $g, $b) {
  $r = round(max(min($r, 100), 0) * 2.55);
  $g = round(max(min($g, 100), 0) * 2.55);
  $b = round(max(min($b, 100), 0) * 2.55);
  $hex = '#';
  $hex .= str_pad(dechex($r), 2, '0', STR_PAD_LEFT);
  $hex .= str_pad(dechex($g), 2, '0', STR_PAD_LEFT);
  $hex .= str_pad(dechex($b), 2, '0', STR_PAD_LEFT);
  return $hex;
}

function colour_blend($c1, $c2, $ratio) {
  $ratio = max(min($ratio, 1), 0);
  $r1 = hexdec(substr($c1, 1, 2));
  $g1 = hexdec(substr($c1, 3, 2));
  $b1 = hexdec(substr($c1, 5, 2));
  $r2 = hexdec(substr($c2, 1, 2));
  $g2 = hexdec(substr($c2, 3, 2));
  $b2 = hexdec(substr($c2, 5, 2));
  $r = round($r1 * (1 - $ratio) + $r2 * $ratio);
  $g = round($g1 * (1 - $ratio) + $g2 * $ratio);
  $b = round($b1 * (1 - $ratio) + $b2 * $ratio);
  $hex = '#';
  $hex .= str_pad(dechex($r), 2, '0', STR_PAD_LEFT);
  $hex .= str_pad(dechex($g), 2, '0', STR_PAD_LEFT);
  $hex .= str_pad(dechex($b), 2, '0', STR_PAD_LEFT);
  return $hex;
}


'#ff0000';

'#3333ff';

colour_random();

colour_rgb(100, 50, 0);

colour_rgb(0, 1, 20);

colour_blend('#ff0000', '#3333ff', 0.5);

colour_blend('#000000', '#ffffff', 0.3);
