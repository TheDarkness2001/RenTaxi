import 'package:flutter/material.dart';
import '../home/home_screen.dart';

class KycFlowScreen extends StatefulWidget {
  const KycFlowScreen({super.key});

  @override
  State<KycFlowScreen> createState() => _KycFlowScreenState();
}

class _KycFlowScreenState extends State<KycFlowScreen> {
  int _step = 0;
  final _steps = ['Pasport (old)', 'Pasport (orqa)', 'Selfi + Liveness'];

  void _nextStep() {
    if (_step < _steps.length - 1) {
      setState(() => _step++);
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Shaxsni tasdiqlash')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LinearProgressIndicator(
              value: (_step + 1) / _steps.length,
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 24),
            Text(
              'Qadam ${_step + 1}/${_steps.length}',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Text(
              _steps[_step],
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 16),
            Text(
              'Bir shaxs = bitta akkaunt. Pasport ma\'lumotlaringiz OCR orqali tekshiriladi va yuzingiz pasportdagi surat bilan solishtiriladi.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey),
            ),
            const Spacer(),
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Theme.of(context).cardTheme.color,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.withOpacity(0.2)),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.camera_alt_outlined, size: 48, color: Colors.grey.shade400),
                  const SizedBox(height: 8),
                  Text('Surat yuklang', style: TextStyle(color: Colors.grey.shade500)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _nextStep,
              child: Text(_step < _steps.length - 1 ? 'Keyingi' : 'Tasdiqlash'),
            ),
          ],
        ),
      ),
    );
  }
}
