// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Soil Monitor';

  @override
  String get dashboard => 'Dashboard';

  @override
  String get node => 'Node';

  @override
  String get moisture => 'Soil Moisture';

  @override
  String get temperature => 'Temperature';

  @override
  String get humidity => 'Humidity';

  @override
  String get goodCondition => 'Good Condition';

  @override
  String get needsWater => 'Needs Water';

  @override
  String get tooWet => 'Too Wet';

  @override
  String get recommendations => 'Recommendations';

  @override
  String get waterNow => 'Water your crops now. Soil is dry.';

  @override
  String get dontWater => 'Don\'t water today. Soil has enough moisture.';

  @override
  String get checkDrainage => 'Check drainage. Soil is too wet.';

  @override
  String get idealTemp => 'Temperature is ideal for crop growth.';

  @override
  String get lastUpdated => 'Last Updated';

  @override
  String get settings => 'Settings';

  @override
  String get language => 'Language';

  @override
  String get refresh => 'Refresh';
}
