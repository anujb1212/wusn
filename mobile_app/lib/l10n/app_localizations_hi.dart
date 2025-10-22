// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Hindi (`hi`).
class AppLocalizationsHi extends AppLocalizations {
  AppLocalizationsHi([String locale = 'hi']) : super(locale);

  @override
  String get appTitle => 'मिट्टी निगरानी';

  @override
  String get dashboard => 'डैशबोर्ड';

  @override
  String get node => 'नोड';

  @override
  String get moisture => 'मिट्टी की नमी';

  @override
  String get temperature => 'तापमान';

  @override
  String get humidity => 'आर्द्रता';

  @override
  String get goodCondition => 'अच्छी स्थिति';

  @override
  String get needsWater => 'पानी चाहिए';

  @override
  String get tooWet => 'बहुत गीला';

  @override
  String get recommendations => 'सुझाव';

  @override
  String get waterNow => 'अभी पानी दें। मिट्टी सूखी है।';

  @override
  String get dontWater => 'आज पानी न दें। मिट्टी में पर्याप्त नमी है।';

  @override
  String get checkDrainage => 'जल निकासी जांचें। मिट्टी बहुत गीली है।';

  @override
  String get idealTemp => 'तापमान फसल के लिए सही है।';

  @override
  String get lastUpdated => 'अंतिम अपडेट';

  @override
  String get settings => 'सेटिंग्स';

  @override
  String get language => 'भाषा';

  @override
  String get refresh => 'रीफ्रेश करें';
}
