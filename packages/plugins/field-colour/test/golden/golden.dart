import 'dart:math' as Math;

String colour_random() {
  String hex = '0123456789abcdef';
  var rnd = new Math.Random();
  return '#${hex[rnd.nextInt(16)]}${hex[rnd.nextInt(16)]}'
      '${hex[rnd.nextInt(16)]}${hex[rnd.nextInt(16)]}'
      '${hex[rnd.nextInt(16)]}${hex[rnd.nextInt(16)]}';
}

String colour_rgb(num r, num g, num b) {
  num rn = (Math.max(Math.min(r, 100), 0) * 2.55).round();
  String rs = rn.toInt().toRadixString(16);
  rs = '0$rs';
  rs = rs.substring(rs.length - 2);
  num gn = (Math.max(Math.min(g, 100), 0) * 2.55).round();
  String gs = gn.toInt().toRadixString(16);
  gs = '0$gs';
  gs = gs.substring(gs.length - 2);
  num bn = (Math.max(Math.min(b, 100), 0) * 2.55).round();
  String bs = bn.toInt().toRadixString(16);
  bs = '0$bs';
  bs = bs.substring(bs.length - 2);
  return '#$rs$gs$bs';
}

String colour_blend(String c1, String c2, num ratio) {
  ratio = Math.max(Math.min(ratio, 1), 0);
  int r1 = int.parse('0x${c1.substring(1, 3)}');
  int g1 = int.parse('0x${c1.substring(3, 5)}');
  int b1 = int.parse('0x${c1.substring(5, 7)}');
  int r2 = int.parse('0x${c2.substring(1, 3)}');
  int g2 = int.parse('0x${c2.substring(3, 5)}');
  int b2 = int.parse('0x${c2.substring(5, 7)}');
  num rn = (r1 * (1 - ratio) + r2 * ratio).round();
  String rs = rn.toInt().toRadixString(16);
  num gn = (g1 * (1 - ratio) + g2 * ratio).round();
  String gs = gn.toInt().toRadixString(16);
  num bn = (b1 * (1 - ratio) + b2 * ratio).round();
  String bs = bn.toInt().toRadixString(16);
  rs = '0$rs';
  rs = rs.substring(rs.length - 2);
  gs = '0$gs';
  gs = gs.substring(gs.length - 2);
  bs = '0$bs';
  bs = bs.substring(bs.length - 2);
  return '#$rs$gs$bs';
}


main() {
  '#ff0000';

  '#3333ff';

  colour_random();

  colour_rgb(100, 50, 0);

  colour_rgb(0, 1, 20);

  colour_blend('#ff0000', '#3333ff', 0.5);

  colour_blend('#000000', '#ffffff', 0.3);
}