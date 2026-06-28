import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api/identity_api.dart';
import '../home/home_screen.dart';

class KycFlowScreen extends StatefulWidget {
  const KycFlowScreen({super.key});

  @override
  State<KycFlowScreen> createState() => _KycFlowScreenState();
}

class _KycStep {
  final String title;
  final String hint;
  final String docType;
  final bool useFrontCamera;

  const _KycStep({
    required this.title,
    required this.hint,
    required this.docType,
    this.useFrontCamera = false,
  });
}

class _KycFlowScreenState extends State<KycFlowScreen> {
  final _identityApi = IdentityApi();
  final _picker = ImagePicker();

  static const _steps = [
    _KycStep(
      title: 'Pasport (old tomoni)',
      hint: 'Pasportning rasmli old tomonini aniq surating.',
      docType: 'passport_front',
    ),
    _KycStep(
      title: 'Pasport (orqa tomoni)',
      hint: 'Pasportning orqa tomonini aniq surating.',
      docType: 'passport_back',
    ),
    _KycStep(
      title: 'Selfi',
      hint: 'Yuzingiz to\'liq ko\'rinsin. Ko\'zoynak yoki maska bo\'lmasin.',
      docType: 'selfie',
      useFrontCamera: true,
    ),
  ];

  int _step = 0;
  final Map<String, File> _photos = {};
  bool _loading = false;
  String? _error;

  Future<void> _capturePhoto() async {
    setState(() {
      _error = null;
    });

    try {
      final step = _steps[_step];
      final image = await _picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice:
            step.useFrontCamera ? CameraDevice.front : CameraDevice.rear,
        imageQuality: 85,
      );

      if (image == null) return;

      setState(() {
        _photos[step.docType] = File(image.path);
      });
    } catch (e) {
      setState(() {
        _error = 'Kameraga ruxsat bering yoki qayta urinib ko\'ring.';
      });
    }
  }

  Future<void> _pickFromGallery() async {
    setState(() {
      _error = null;
    });

    try {
      final step = _steps[_step];
      final image = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );

      if (image == null) return;

      setState(() {
        _photos[step.docType] = File(image.path);
      });
    } catch (e) {
      setState(() {
        _error = 'Rasm tanlanmadi. Qayta urinib ko\'ring.';
      });
    }
  }

  Future<void> _nextStep() async {
    final step = _steps[_step];
    if (!_photos.containsKey(step.docType)) {
      setState(() {
        _error = 'Avval surat oling yoki galereyadan tanlang.';
      });
      return;
    }

    if (_step < _steps.length - 1) {
      setState(() {
        _step++;
        _error = null;
      });
      return;
    }

    await _submitKyc();
  }

  Future<void> _submitKyc() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      for (final step in _steps) {
        await _identityApi.uploadDocument(type: step.docType);
      }

      await _identityApi.submitVerification();

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('ApiException: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final step = _steps[_step];
    final photo = _photos[step.docType];

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
              step.title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              step.hint,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: GestureDetector(
                onTap: _loading ? null : _capturePhoto,
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardTheme.color,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: photo != null ? Colors.teal : Colors.grey.withOpacity(0.3),
                      width: photo != null ? 2 : 1,
                    ),
                  ),
                  child: photo != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Image.file(photo, fit: BoxFit.contain),
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.camera_alt_outlined, size: 48, color: Colors.grey.shade400),
                            const SizedBox(height: 8),
                            Text('Surat olish uchun bosing', style: TextStyle(color: Colors.grey.shade500)),
                          ],
                        ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _loading ? null : _capturePhoto,
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('Kamera'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _loading ? null : _pickFromGallery,
                    icon: const Icon(Icons.photo_library_outlined),
                    label: const Text('Galereya'),
                  ),
                ),
              ],
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
            ],
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loading ? null : _nextStep,
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(_step < _steps.length - 1 ? 'Keyingi' : 'Tasdiqlash'),
            ),
          ],
        ),
      ),
    );
  }
}
