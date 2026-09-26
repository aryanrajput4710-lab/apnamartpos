
const prisma = require('../utils/prisma');
const cache = require('../utils/cache');

const getSettings = async (req, res) => {
  try {
    const cachedSettings = cache.get('store_settings');
    if (cachedSettings) {
      return res.status(200).json({ success: true, data: cachedSettings });
    }

    let settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.storeSettings.create({ data: { id: 'default' } });
    }

    cache.set('store_settings', settings);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { storeName, storeAddress, storePhone, receiptFooter, paymentQrCodeUrl } = req.body;
    
    const settings = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: { storeName, storeAddress, storePhone, receiptFooter, paymentQrCodeUrl },
      create: { id: 'default', storeName, storeAddress, storePhone, receiptFooter, paymentQrCodeUrl }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'STORE_SETTINGS_UPDATED',
        entityType: 'SETTINGS',
        description: 'Store settings updated',
      }
    });

    // Invalidate the cache when settings are updated
    cache.del('store_settings');

    res.status(200).json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
