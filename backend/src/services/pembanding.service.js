class PembandingService {
  /**
   * Menghasilkan keyword pencarian dari data aset
   */
  generateSearchKeyword(asset) {
    const keywords = [asset.nama];
    
    if (asset.assetVehicle) {
      keywords.push(asset.assetVehicle.brand);
      keywords.push(asset.assetVehicle.type);
      keywords.push(asset.assetVehicle.year);
    } else if (asset.assetProperty) {
      keywords.push(asset.assetProperty.city);
      keywords.push(asset.assetProperty.district);
    } else if (asset.assetElectronic) {
      keywords.push(asset.assetElectronic.brand);
      keywords.push(asset.assetElectronic.type);
    }

    return keywords.filter(Boolean).join(' ');
  }

  /**
   * Menghitung skor kecocokan sederhana (0-100)
   */
  calculateMatchScore(asset, comparable) {
    let score = 100;
    
    // Penalti jika tahun berbeda
    if (asset.assetVehicle && comparable.tahun) {
      const yearDiff = Math.abs(asset.assetVehicle.year - comparable.tahun);
      score -= yearDiff * 5; // Kurangi 5 poin per tahun perbedaan
    }
    
    // Pastikan skor tidak di bawah 0
    return Math.max(0, score);
  }

  /**
   * Mock pencarian data pembanding (Nantinya diganti dengan scraping beneran)
   */
  async findComparableAssets(asset) {
    const keyword = this.generateSearchKeyword(asset);
    
    // Mock data untuk keperluan demo
    const basePrice = Number(asset.hargaPasar) || 10000000;
    const currentYear = new Date().getFullYear();
    
    const mockData = [];
    for (let i = 1; i <= 8; i++) {
      // Randomize price +/- 20%
      const variance = (Math.random() * 0.4) - 0.2;
      const price = basePrice * (1 + variance);
      
      const comparable = {
        judul: `${keyword} - Pilihan ${i}`,
        sumber: i % 2 === 0 ? 'Marketplace A' : 'Marketplace B',
        sourceUrl: `https://example.com/item-${i}`,
        harga: Math.round(price),
        lokasi: asset.assetProperty ? asset.assetProperty.city : 'Jakarta',
        tahun: asset.assetVehicle ? asset.assetVehicle.year : currentYear,
        kondisi: i % 3 === 0 ? 'Bekas - Baik' : 'Bekas - Sangat Baik',
        spesifikasi: `Spesifikasi standar untuk ${keyword}`,
      };
      
      comparable.skorKecocokan = this.calculateMatchScore(asset, comparable);
      mockData.push(comparable);
    }
    
    return mockData;
  }

  /**
   * Menghapus harga outliers dengan metode IQR
   */
  removeOutliers(prices) {
    if (prices.length < 4) return prices; // Butuh minimal 4 data untuk IQR yang meaningful
    
    const sorted = [...prices].sort((a, b) => a - b);
    
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return prices.filter(p => p >= lowerBound && p <= upperBound);
  }

  /**
   * Menghitung nilai median
   */
  calculateMedian(prices) {
    if (!prices || prices.length === 0) return 0;
    
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    return sorted[mid];
  }
}

export const pembandingService = new PembandingService();
