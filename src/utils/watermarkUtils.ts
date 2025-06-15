interface WatermarkConfig {
  watermarkText: string;
  centerWatermarkText: string;
  watermarkStyle: string;
  clientEmail?: string;
}

export const addWatermarks = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  config: WatermarkConfig
) => {
  const { watermarkText, centerWatermarkText, watermarkStyle, clientEmail } = config;
  const showCorners = watermarkStyle === 'corners' || watermarkStyle === 'full';
  const showCenter = watermarkStyle === 'center' || watermarkStyle === 'full';

  ctx.save();

  if (showCorners) {
    // Corner watermarks with client email
    
    const infoParts = [watermarkText];
    if (clientEmail) {
      infoParts.push(clientEmail);
    }
    const watermarkWithInfo = infoParts.join(' - ');
    
    ctx.font = `${Math.max(12, width * 0.015)}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 2;

    // Top-left
    ctx.strokeText(watermarkWithInfo, 20, 30);
    ctx.fillText(watermarkWithInfo, 20, 30);

    // Bottom-right
    const textWidth = ctx.measureText(watermarkWithInfo).width;
    ctx.strokeText(watermarkWithInfo, width - textWidth - 20, height - 20);
    ctx.fillText(watermarkWithInfo, width - textWidth - 20, height - 20);
  }

  if (showCenter) {
    // Center watermark
    ctx.font = `${Math.max(24, width * 0.03)}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(Math.PI / 8); // 22.5 degrees
    
    ctx.strokeText(centerWatermarkText, 0, 0);
    ctx.fillText(centerWatermarkText, 0, 0);
    
    ctx.restore();
  }

  ctx.restore();
};

export const addNoisePattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // Add subtle noise pattern to make automated watermark removal harder
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < 0.001) { // Very sparse noise
      const noise = Math.random() * 10 - 5;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }
  }

  ctx.putImageData(imageData, 0, 0);
};
