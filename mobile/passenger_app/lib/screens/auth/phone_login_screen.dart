import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/api/auth_api.dart';
import '../kyc/kyc_flow_screen.dart';
import '../home/home_screen.dart';

class PhoneLoginScreen extends StatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  State<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends State<PhoneLoginScreen> {
  final _phoneController = TextEditingController(text: '+998');
  final _otpController = TextEditingController();
  final _authApi = AuthApi();
  bool _otpSent = false;
  bool _loading = false;
  String? _error;

  Future<void> _sendOtp() async {
    setState(() { _loading = true; _error = null; });
    try {
      await _authApi.sendOtp(_phoneController.text.trim());
      setState(() => _otpSent = true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _verifyOtp() async {
    setState(() { _loading = true; _error = null; });
    try {
      final result = await _authApi.verifyOtp(
        _phoneController.text.trim(),
        _otpController.text.trim(),
      );
      if (!mounted) return;

      final user = result['user'] as Map<String, dynamic>?;
      final status = user?['status'] as String?;

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => status == 'active' ? const HomeScreen() : const KycFlowScreen(),
        ),
      );
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kirish')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Telefon raqamingiz',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'SMS orqali tasdiqlash kodi yuboramiz',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey),
            ),
            const SizedBox(height: 32),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[+\d]'))],
              decoration: InputDecoration(
                hintText: '+998901234567',
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              ),
            ),
            if (_otpSent) ...[
              const SizedBox(height: 16),
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: InputDecoration(
                  hintText: '123456',
                  counterText: '',
                  filled: true,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 8),
              Text('Dev mode: kod 123456', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
            ],
            const Spacer(),
            ElevatedButton(
              onPressed: _loading ? null : (_otpSent ? _verifyOtp : _sendOtp),
              child: _loading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(_otpSent ? 'Tasdiqlash' : 'Kod yuborish'),
            ),
          ],
        ),
      ),
    );
  }
}
