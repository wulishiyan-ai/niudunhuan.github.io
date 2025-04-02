/**
 * 牛顿环仿真实验模块
 * 实现牛顿环干涉图案绘制和参数计算
 */

// 全局变量
let ringsCanvas = null;
let ringsContext = null;
let selectedRing = null;
let measurementData = [];
let isSimulationRunning = false;

// 交互状态变量
let scale = 1;
let offsetX = 0, offsetY = 0;
let isDragging = false;
let lastX, lastY;

document.addEventListener('DOMContentLoaded', function() {
    // 初始化画布
    initCanvas();
    
    // 绑定计算按钮事件
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateCurvatureRadius);
    }
    
    // 绑定参数变化事件
    const radiusSlider = document.getElementById('radius');
    const radiusValue = document.getElementById('radius-value');
    const wavelengthSlider = document.getElementById('wavelength');
    const wavelengthDirect = document.getElementById('wavelength-direct');
    
    if (radiusSlider && radiusValue) {
        // 滑块改变时更新直接输入框
        radiusSlider.addEventListener('input', function() {
            radiusValue.textContent = this.value + ' mm';
            updateNewtonRings();
        });
    }
    
    if (wavelengthSlider && wavelengthDirect) {
        // 波长滑块改变
        wavelengthSlider.addEventListener('input', function() {
            wavelengthDirect.value = this.value;
            updateNewtonRings();
        });
        
        // 直接输入波长
        wavelengthDirect.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (!isNaN(value) && value >= 380 && value <= 780) {
                wavelengthSlider.value = value;
                updateNewtonRings();
            }
        });
    }
    
    // 初始化缩放控制
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const resetView = document.getElementById('reset-view');
    
    if (zoomIn) {
        zoomIn.addEventListener('click', function() {
            scale = Math.min(3, scale + 0.2);
            updateNewtonRings();
        });
    }
    
    if (zoomOut) {
        zoomOut.addEventListener('click', function() {
            scale = Math.max(0.5, scale - 0.2);
            updateNewtonRings();
        });
    }
    
    if (resetView) {
        resetView.addEventListener('click', function() {
            scale = 1;
            offsetX = 0;
            offsetY = 0;
            updateNewtonRings();
        });
    }
    
    // 绑定测量数据按钮
    bindMeasurementButtons();
    
    // 初始绘制牛顿环
    updateNewtonRings();
});

/**
 * 绑定测量数据相关按钮事件
 */
function bindMeasurementButtons() {
    // 添加测量点按钮
    const addDataBtn = document.getElementById('add-data-point');
    if (addDataBtn) {
        addDataBtn.addEventListener('click', function() {
            if (selectedRing) {
                addMeasurementData(selectedRing);
            } else {
                showSelectionToast('请先在牛顿环图像上选择一个环');
            }
        });
    }
    
    // 清除数据按钮
    const clearDataBtn = document.getElementById('clear-data');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearMeasurementData);
    }
    
    // 根据测量数据计算按钮
    const calculateFromDataBtn = document.getElementById('calculate-from-data');
    if (calculateFromDataBtn) {
        calculateFromDataBtn.addEventListener('click', calculateFromMeasurementData);
    }
}

/**
 * 初始化牛顿环画布
 */
function initCanvas() {
    ringsCanvas = document.getElementById('newton-rings-canvas');
    if (!ringsCanvas) {
        console.error('找不到牛顿环画布元素');
        return;
    }
    
    ringsContext = ringsCanvas.getContext('2d');
    
    // 设置画布交互
    setupCanvasInteraction(ringsCanvas);
    
    console.log('牛顿环画布初始化完成');
}

/**
 * 设置画布交互功能
 */
function setupCanvasInteraction(canvas) {
    if (!canvas) return;
    
    // 鼠标按下事件
    canvas.addEventListener('mousedown', function(e) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
        
        // 检查是否点击了某个环
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        checkRingSelection(mouseX, mouseY);
    });
    
    // 鼠标移动事件
    canvas.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const deltaX = e.clientX - lastX;
            const deltaY = e.clientY - lastY;
            
            offsetX += deltaX;
            offsetY += deltaY;
            
            lastX = e.clientX;
            lastY = e.clientY;
            
            updateNewtonRings();
        }
    });
    
    // 鼠标释放事件
    canvas.addEventListener('mouseup', function() {
        isDragging = false;
        canvas.style.cursor = 'pointer';
    });
    
    canvas.addEventListener('mouseleave', function() {
        isDragging = false;
        canvas.style.cursor = 'pointer';
    });
    
    // 鼠标滚轮缩放
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        scale = Math.max(0.5, Math.min(3, scale + delta));
        
        updateNewtonRings();
    });
    
    // 设置初始光标样式
    canvas.style.cursor = 'pointer';
}

/**
 * 检查环选择
 */
function checkRingSelection(mouseX, mouseY) {
    if (!ringsCanvas) return;
    
    const centerX = ringsCanvas.width / 2 + offsetX;
    const centerY = ringsCanvas.height / 2 + offsetY;
    
    // 获取当前参数
    const radius = parseFloat(document.getElementById('radius').value);
    const wavelength = parseFloat(document.getElementById('wavelength').value) * 1e-9;
    
    // 计算鼠标点击位置到中心的距离
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 计算环的物理半径和像素半径
    const rings = calculateRings(radius, wavelength);
    
    // 查找最接近的环
    let closestRing = null;
    let minDistance = Infinity;
    
    rings.forEach(ring => {
        const pixelRadius = ring.pixelRadius * scale;
        const distDiff = Math.abs(distance - pixelRadius);
        
        if (distDiff < minDistance && distDiff < 10) {
            minDistance = distDiff;
            closestRing = ring;
        }
    });
    
    if (closestRing) {
        selectedRing = closestRing;
        
        // 更新环信息显示
        const ringInfo = document.getElementById('ring-info');
        if (ringInfo) {
            ringInfo.innerHTML = `选中${selectedRing.type === 'dark' ? '暗' : '亮'}环: m=${selectedRing.m}，直径=${selectedRing.diameter.toFixed(2)}mm`;
        }
        
        // 重绘牛顿环以高亮显示选中环
        updateNewtonRings();
        
        // 显示提示信息
        showSelectionToast(`已选择${selectedRing.type === 'dark' ? '暗' : '亮'}环 m=${selectedRing.m}，点击"添加测量点"添加到数据表`);
    }
}

/**
 * 计算环数据
 */
function calculateRings(radius, wavelength) {
    const rings = [];
    const canvasSize = ringsCanvas.width;
    const maxRadius = canvasSize * 0.45; // 最大绘制半径（像素）
    
    // 计算物理比例尺（像素/毫米）
    const scale = maxRadius / 5; // 假设5mm的最大显示范围
    
    // 牛顿环的两种类型：暗环和亮环
    
    // 暗环：D_m² = 4λR*m，m从1开始
    for (let m = 1; m <= 15; m++) {
        // 计算暗环的物理半径（单位：mm）
        // 注意：wavelength单位是m，radius单位是mm
        // 所以需要将wavelength转换成mm：wavelength * 1000
        const physicalRadius = Math.sqrt(m * wavelength * 1000 * radius);
        const pixelRadius = physicalRadius * scale;
        
        // 确保环在画布范围内
        if (pixelRadius <= maxRadius) {
            rings.push({
                m: m,
                type: 'dark',
                radius: physicalRadius,
                diameter: physicalRadius * 2,
                diameterSquared: Math.pow(physicalRadius * 2, 2),
                pixelRadius: pixelRadius
            });
        }
    }
    
    // 亮环：D_m² = 4λR*(m-0.5)，m从1开始
    for (let m = 1; m <= 15; m++) {
        // 计算亮环的物理半径（单位：mm）
        const physicalRadius = Math.sqrt((m - 0.5) * wavelength * 1000 * radius);
        const pixelRadius = physicalRadius * scale;
        
        // 确保环在画布范围内
        if (pixelRadius <= maxRadius) {
            rings.push({
                m: m,
                type: 'bright',
                radius: physicalRadius,
                diameter: physicalRadius * 2,
                diameterSquared: Math.pow(physicalRadius * 2, 2),
                pixelRadius: pixelRadius
            });
        }
    }
    
    // 按半径排序
    rings.sort((a, b) => a.radius - b.radius);
    
    return rings;
}

/**
 * 更新牛顿环绘制
 */
function updateNewtonRings() {
    if (!ringsCanvas || !ringsContext) {
        console.error('画布未初始化');
        return;
    }
    
    // 显示加载状态
    showLoadingState(true);
    
    // 清空画布
    ringsContext.clearRect(0, 0, ringsCanvas.width, ringsCanvas.height);
    
    // 获取当前参数
    const radius = parseFloat(document.getElementById('radius').value);
    const wavelength = parseFloat(document.getElementById('wavelength').value);
    
    // 计算中心位置
    const centerX = ringsCanvas.width / 2 + offsetX;
    const centerY = ringsCanvas.height / 2 + offsetY;
    
    // 绘制牛顿环干涉图案
    drawNewtonRings(centerX, centerY, radius, wavelength);
    
    // 计算环数据
    const rings = calculateRings(radius, wavelength * 1e-9);
    
    // 绘制环标记
    drawRingMarkers(rings, centerX, centerY);
    
    // 绘制环标签
    drawRingLabels(rings, centerX, centerY);
    
    // 隐藏加载状态
    showLoadingState(false);
}

/**
 * 绘制牛顿环干涉图案
 */
function drawNewtonRings(centerX, centerY, radius, wavelength) {
    const canvasWidth = ringsCanvas.width;
    const canvasHeight = ringsCanvas.height;
    
    // 创建图像数据
    const imageData = ringsContext.createImageData(canvasWidth, canvasHeight);
    const data = imageData.data;
    
    // 转换波长到RGB颜色，并增强色彩饱和度
    const { r, g, b } = wavelengthToRGB(wavelength);
    
    // 增强对比度系数
    const contrastFactor = 1.5;
    
    // 计算物理参数
    const R = radius; // 曲率半径，单位：mm
    const lambda = wavelength * 1e-9; // 波长，单位：m
    
    // 绘制干涉图案
    for (let y = 0; y < canvasHeight; y++) {
        for (let x = 0; x < canvasWidth; x++) {
            // 计算点到中心的距离
            const dx = (x - centerX) / scale;
            const dy = (y - centerY) / scale;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 将距离转换为物理尺寸（mm）
            const physicalDistance = distance * 0.1; // 像素到毫米的转换
            
            // 计算空气薄膜厚度
            const h = physicalDistance * physicalDistance / (2 * R);
            
            // 计算光程差
            const delta = 2 * h;
            
            // 计算相位差（π/λ为附加相位）
            const phi = (2 * Math.PI * delta / lambda) + Math.PI;
            
            // 计算干涉强度（余弦函数模拟干涉）
            let intensity = (Math.cos(phi) + 1) / 2;
            
            // 增强对比度，使用非线性转换
            intensity = Math.pow(intensity, 0.6);
            
            // 应用对比度增强
            let r1 = Math.min(255, Math.round(r * intensity * contrastFactor));
            let g1 = Math.min(255, Math.round(g * intensity * contrastFactor));
            let b1 = Math.min(255, Math.round(b * intensity * contrastFactor));
            
            // 增加基础亮度，使暗区不会太暗
            const baseBrightness = 25;
            r1 = Math.min(255, r1 + baseBrightness);
            g1 = Math.min(255, g1 + baseBrightness);
            b1 = Math.min(255, b1 + baseBrightness);
            
            // 填充像素颜色
            const pixelIndex = (y * canvasWidth + x) * 4;
            data[pixelIndex] = r1;
            data[pixelIndex + 1] = g1;
            data[pixelIndex + 2] = b1;
            data[pixelIndex + 3] = 255; // 不透明
        }
    }
    
    // 将图像数据绘制到画布
    ringsContext.putImageData(imageData, 0, 0);
    
    // 添加环形渐变覆盖层，增强中心亮度
    ringsContext.save();
    const gradient = ringsContext.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, canvasWidth / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
    ringsContext.fillStyle = gradient;
    ringsContext.fillRect(0, 0, canvasWidth, canvasHeight);
    ringsContext.restore();
}

/**
 * 绘制环标记
 */
function drawRingMarkers(rings, centerX, centerY) {
    if (!ringsContext) return;
    
    rings.forEach(ring => {
        const pixelRadius = ring.pixelRadius * scale;
        
        // 设置样式（区分暗环和亮环，选中环特殊标记）
        if (selectedRing && selectedRing.m === ring.m && selectedRing.type === ring.type) {
            // 选中环 - 明亮的黄色
            ringsContext.strokeStyle = 'rgba(255, 255, 0, 0.9)';
            ringsContext.lineWidth = 3;
            
            // 添加高亮发光效果
            ringsContext.shadowColor = 'rgba(255, 255, 0, 0.7)';
            ringsContext.shadowBlur = 8;
        } else if (ring.type === 'dark') {
            // 暗环 - 使用高对比度的白色
            ringsContext.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ringsContext.lineWidth = 1.5;
            ringsContext.shadowBlur = 0;
        } else {
            // 亮环 - 使用鲜明的蓝色
            ringsContext.strokeStyle = 'rgba(100, 200, 255, 0.8)';
            ringsContext.lineWidth = 1.5;
            ringsContext.shadowBlur = 0;
        }
        
        // 绘制环标记
        ringsContext.beginPath();
        ringsContext.arc(centerX, centerY, pixelRadius, 0, 2 * Math.PI);
        ringsContext.stroke();
        
        // 重置阴影
        ringsContext.shadowBlur = 0;
    });
}

/**
 * 绘制环标签
 */
function drawRingLabels(rings, centerX, centerY) {
    if (!ringsContext) return;
    
    // 只显示一部分环的标签，避免过于拥挤
    const labelStep = Math.max(1, Math.floor(rings.length / 8));
    
    rings.forEach((ring, index) => {
        if (index % labelStep !== 0 && !(selectedRing && selectedRing.m === ring.m && selectedRing.type === ring.type)) return;
        
        const pixelRadius = ring.pixelRadius * scale;
        
        // 设置标签位置（根据环的类型和位置调整角度）
        const angle = (index % 4) * Math.PI / 2 + Math.PI / 4;
        const labelX = centerX + Math.cos(angle) * pixelRadius * 0.9;
        const labelY = centerY + Math.sin(angle) * pixelRadius * 0.9;
        
        // 添加标签背景以提高可读性
        let bgColor, textColor;
        let fontSize = '12px';
        let fontWeight = 'normal';
        
        if (selectedRing && selectedRing.m === ring.m && selectedRing.type === ring.type) {
            // 选中环的标签
            bgColor = 'rgba(0, 0, 0, 0.7)';
            textColor = 'yellow';
            fontSize = '14px';
            fontWeight = 'bold';
        } else if (ring.type === 'dark') {
            // 暗环的标签
            bgColor = 'rgba(0, 0, 0, 0.6)';
            textColor = 'white';
        } else {
            // 亮环的标签
            bgColor = 'rgba(0, 0, 0, 0.6)';
            textColor = 'rgb(120, 220, 255)';
        }
        
        const labelText = `${ring.type === 'dark' ? '暗' : '亮'}环 m=${ring.m}`;
        
        // 测量文本宽度，以便设置背景
        ringsContext.font = `${fontWeight} ${fontSize} Arial`;
        const textWidth = ringsContext.measureText(labelText).width;
        
        // 绘制背景矩形
        ringsContext.fillStyle = bgColor;
        ringsContext.fillRect(
            labelX - 4, 
            labelY - 14, 
            textWidth + 8, 
            18
        );
        
        // 绘制标签文本
        ringsContext.fillStyle = textColor;
        ringsContext.font = `${fontWeight} ${fontSize} Arial`;
        ringsContext.fillText(labelText, labelX, labelY);
    });
}

/**
 * 添加测量数据
 */
function addMeasurementData(ring) {
    if (!ring) {
        // 如果没有选中环，提示用户
        showSelectionToast('请先在牛顿环图像上选择一个环');
        return;
    }
    
    // 检查是否已经存在相同环序的数据
    const existingIndex = measurementData.findIndex(item => item.m === ring.m);
    
    if (existingIndex >= 0) {
        // 如果已存在，则更新数据
        measurementData[existingIndex] = { ...ring };
    } else {
        // 如果不存在，则添加新数据
        measurementData.push({ ...ring });
        
        // 按环序排序
        measurementData.sort((a, b) => a.m - b.m);
    }
    
    // 更新数据表格
    updateMeasurementTable();
    
    // 显示提示
    showSelectionToast(`已将环 m=${ring.m} 添加到数据表格`);
}

/**
 * 清除测量数据
 */
function clearMeasurementData() {
    // 清空数据数组
    measurementData = [];
    
    // 更新表格
    updateMeasurementTable();
    
    // 清除选中环
    selectedRing = null;
    updateNewtonRings();
    
    // 显示提示
    showSelectionToast('已清除所有测量数据');
}

/**
 * 更新测量数据表格
 */
function updateMeasurementTable() {
    const tableBody = document.querySelector('#measurement-table tbody');
    if (!tableBody) return;
    
    // 清空表格
    tableBody.innerHTML = '';
    
    // 如果没有数据，显示空行
    if (measurementData.length === 0) {
        for (let i = 1; i <= 5; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${i}</td>
                <td>--</td>
                <td>--</td>
                <td>--</td>
            `;
            tableBody.appendChild(row);
        }
        return;
    }
    
    // 添加数据行
    measurementData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.m}</td>
            <td>${item.type === 'dark' ? '暗环' : '亮环'}</td>
            <td>${item.diameter.toFixed(2)}</td>
            <td>${item.diameterSquared.toFixed(2)}</td>
        `;
        
        // 添加删除按钮
        const deleteCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '删除';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => {
            // 从数组中移除该项
            measurementData = measurementData.filter(data => data.m !== item.m || data.type !== item.type);
            // 更新表格
            updateMeasurementTable();
        };
        deleteCell.appendChild(deleteBtn);
        row.appendChild(deleteCell);
        
        tableBody.appendChild(row);
    });
    
    // 如果行数少于5行，添加空行
    const currentRows = tableBody.children.length;
    if (currentRows < 5) {
        for (let i = currentRows + 1; i <= 5; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${i}</td>
                <td>--</td>
                <td>--</td>
                <td>--</td>
                <td></td>
            `;
            tableBody.appendChild(row);
        }
    }
}

/**
 * 根据测量数据计算曲率半径
 */
function calculateFromMeasurementData() {
    // 检查是否有足够的数据
    if (measurementData.length < 3) {
        alert('需要至少3个测量点才能进行计算');
        return;
    }
    
    // 获取当前波长
    const wavelength = parseFloat(document.getElementById('wavelength').value) * 1e-9; // 转换为m
    const realRadius = parseFloat(document.getElementById('radius').value); // 真实曲率半径，用于比较
    
    // 开始测量时间
    const startTime = performance.now();
    
    // 准备线性回归数据 - 使用改进的模型
    // 分为两种情况：
    // 对于暗环：D_m² = 4λR(m) 
    // 对于亮环：D_m² = 4λR(m-1/2)
    
    // 将暗环和亮环分开处理
    const darkRings = measurementData.filter(item => item.type === 'dark');
    const brightRings = measurementData.filter(item => item.type === 'bright');
    
    let measuredRadius = 0;
    let slope = 0;
    let intercept = 0;
    let rSquared = 0;
    let standardError = 0;
    let slopeStandardError = 0;
    let radiusUncertainty = 0;
    let uncertaintyPercent = 0;
    
    // 选择使用哪种环类型进行计算，优先使用数量更多的类型
    let ringType = '混合';
    let combinedData = [];
    
    if (darkRings.length >= 3 && darkRings.length >= brightRings.length) {
        // 使用暗环进行计算
        ringType = '暗环';
        combinedData = darkRings.map(item => ({
            x: item.m, // 暗环的环序m
            y: item.diameterSquared // D²
        }));
    } else if (brightRings.length >= 3) {
        // 使用亮环进行计算
        ringType = '亮环';
        combinedData = brightRings.map(item => ({
            x: item.m - 0.5, // 亮环的环序m-0.5
            y: item.diameterSquared // D²
        }));
    } else if (measurementData.length >= 3) {
        // 如果单一类型的环不够，则混合使用，但需要适当调整x值
        ringType = '混合';
        combinedData = measurementData.map(item => {
            if (item.type === 'dark') {
                return {
                    x: item.m, // 暗环
                    y: item.diameterSquared
                };
            } else {
                return {
                    x: item.m - 0.5, // 亮环
                    y: item.diameterSquared
                };
            }
        });
    } else {
        alert('需要至少3个同类型的测量点（暗环或亮环）才能获得精确结果');
        return;
    }
    
    // 计算简单线性回归
    // y = ax + b, 其中斜率a = 4λR
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < combinedData.length; i++) {
        sumX += combinedData[i].x;
        sumY += combinedData[i].y;
        sumXY += combinedData[i].x * combinedData[i].y;
        sumX2 += combinedData[i].x * combinedData[i].x;
    }
    
    const n = combinedData.length;
    slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    intercept = (sumY - slope * sumX) / n;
    
    // 注意拦截项应该非常接近零
    // 如果拦截项很大，可能是数据或理论模型有问题
    const interceptError = Math.abs(intercept) > 1.0;
    
    // 计算预测值
    const predictions = combinedData.map(point => slope * point.x + intercept);
    
    // 计算R^2（决定系数）
    let totalSumOfSquares = 0;
    let residualSumOfSquares = 0;
    const mean = sumY / n;
    
    for (let i = 0; i < n; i++) {
        totalSumOfSquares += Math.pow(combinedData[i].y - mean, 2);
        residualSumOfSquares += Math.pow(combinedData[i].y - predictions[i], 2);
    }
    
    rSquared = 1 - (residualSumOfSquares / totalSumOfSquares);
    
    // 计算标准误差
    standardError = Math.sqrt(residualSumOfSquares / (n - 2));
    
    // 计算斜率的标准误差
    slopeStandardError = standardError / Math.sqrt(sumX2 - Math.pow(sumX, 2) / n);
    
    // 计算曲率半径
    // 斜率 = 4λR, 所以 R = 斜率/(4λ)
    // 单位转换：确保计算结果单位是毫米
    measuredRadius = slope / (4 * wavelength) / 1000; // 转换为mm
    
    // 计算测量误差（百分比）
    const relativeError = Math.abs((measuredRadius - realRadius) / realRadius) * 100;
    
    // 计算曲率半径的95%置信区间
    const tValue = 2.306; // 对于小样本（n<30），95%置信区间的t值，这里假设是4个样本
    radiusUncertainty = tValue * slopeStandardError / (4 * wavelength) / 1000; // 转换为mm
    uncertaintyPercent = (radiusUncertainty / measuredRadius) * 100;
    
    // 结束测量时间
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // 显示详细结果
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'detailed-results';
    resultsDiv.innerHTML = `
        <h3>测量详细结果</h3>
        <table>
            <tr><td>使用环类型:</td><td>${ringType}</td></tr>
            <tr><td>测量曲率半径:</td><td>${measuredRadius.toFixed(2)} mm</td></tr>
            <tr><td>实际曲率半径:</td><td>${realRadius.toFixed(2)} mm</td></tr>
            <tr><td>相对误差:</td><td>${relativeError.toFixed(2)}%</td></tr>
            <tr><td>测量精度:</td><td>${(100 - relativeError).toFixed(2)}%</td></tr>
            <tr><td>斜率:</td><td>${slope.toFixed(6)} mm²</td></tr>
            <tr><td>截距:</td><td>${intercept.toFixed(6)} mm² ${interceptError ? '<span style="color:red">(警告：截距过大)</span>' : ''}</td></tr>
            <tr><td>决定系数R²:</td><td>${rSquared.toFixed(4)}</td></tr>
            <tr><td>95%置信区间:</td><td>±${radiusUncertainty.toFixed(2)} mm (±${uncertaintyPercent.toFixed(2)}%)</td></tr>
            <tr><td>测量点数量:</td><td>${n}个点</td></tr>
            <tr><td>响应时间:</td><td>${responseTime.toFixed(2)} ms</td></tr>
        </table>
        <p>拟合曲线方程: D² = ${slope.toFixed(2)}×m${intercept >= 0 ? ' + ' : ' - '}${Math.abs(intercept).toFixed(2)}</p>
        <p>理论模型：对于暗环 D² = 4λR×m，对于亮环 D² = 4λR×(m-0.5)</p>
    `;
    
    // 添加到页面
    const existingResults = document.querySelector('.detailed-results');
    if (existingResults) {
        existingResults.parentNode.removeChild(existingResults);
    }
    
    document.querySelector('.data-analysis').appendChild(resultsDiv);
    
    // 显示成功消息
    showSelectionToast('计算完成，精度: ' + (100 - relativeError).toFixed(2) + '%');
}

/**
 * 计算透镜曲率半径
 */
function calculateCurvatureRadius() {
    // 获取真实参数
    const realRadius = parseFloat(document.getElementById('radius').value); // 真实曲率半径
    const wavelength = parseFloat(document.getElementById('wavelength').value) * 1e-9; // 波长，转换为m
    
    // 显示加载动画
    const resultDisplay = document.querySelector('.result-display');
    if (!resultDisplay) {
        console.error('找不到结果显示区域');
        return;
    }
    
    // 先显示加载状态
    resultDisplay.innerHTML = `
        <p>测量结果: <span id="measurement-result">计算中...</span></p>
        <p>测量精度: <span id="measurement-accuracy">计算中...</span></p>
        <p>响应时间: <span id="response-time">计算中...</span></p>
        <div class="loading-spinner"></div>
    `;
    
    // 记录开始时间
    const startTime = performance.now();
    
    // 模拟计算延迟
    setTimeout(() => {
        try {
            // 添加随机误差模拟测量不确定性
            const errorPercent = (Math.random() * 1.0 - 0.5); // -0.5% 到 +0.5% 之间的随机误差
            const measuredRadius = realRadius * (1 + errorPercent / 100);
            
            // 计算误差和不确定度
            const absoluteError = Math.abs(measuredRadius - realRadius);
            const relativeError = (absoluteError / realRadius) * 100;
            
            // 计算不确定度
            const uncertaintyPercent = 0.8; // 固定0.8%的不确定度
            
            // 计算响应时间
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            // 更新结果显示
            resultDisplay.innerHTML = `
                <p>测量结果: <span id="measurement-result">${measuredRadius.toFixed(2)} mm</span></p>
                <p>测量精度: <span id="measurement-accuracy">${relativeError.toFixed(3)}%</span></p>
                <p>响应时间: <span id="response-time">${responseTime.toFixed(2)} ms</span></p>
            `;
        } catch (error) {
            console.error('计算过程中出错:', error);
            resultDisplay.innerHTML = `
                <p>测量结果: <span id="measurement-result">计算出错</span></p>
                <p>测量精度: <span id="measurement-accuracy">--</span></p>
                <p>响应时间: <span id="response-time">--</span></p>
                <div class="error-message">计算过程中出现错误，请重试</div>
            `;
        }
    }, 800);
}

/**
 * 显示或隐藏加载状态
 */
function showLoadingState(show) {
    const loadingOverlay = document.getElementById('canvas-loading');
    if (!loadingOverlay) return;
    
    if (show) {
        loadingOverlay.style.display = 'flex';
    } else {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * 显示选择提示信息
 */
function showSelectionToast(message) {
    // 检查是否已有toast元素
    let toast = document.querySelector('.selection-toast');
    
    // 如果没有，创建一个
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'selection-toast';
        document.body.appendChild(toast);
    }
    
    // 设置消息
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    
    // 3秒后自动关闭
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, 3000);
}

/**
 * 将波长转换为RGB颜色，增强色彩的饱和度和亮度
 */
function wavelengthToRGB(wavelength) {
    let r, g, b;
    
    // 确保波长在可见光范围内
    wavelength = Math.min(Math.max(380, wavelength), 780);
    
    if (wavelength >= 380 && wavelength < 440) {
        r = -1 * (wavelength - 440) / (440 - 380);
        g = 0;
        b = 1;
    } else if (wavelength >= 440 && wavelength < 490) {
        r = 0;
        g = (wavelength - 440) / (490 - 440);
        b = 1;
    } else if (wavelength >= 490 && wavelength < 510) {
        r = 0;
        g = 1;
        b = -1 * (wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
        r = (wavelength - 510) / (580 - 510);
        g = 1;
        b = 0;
    } else if (wavelength >= 580 && wavelength < 645) {
        r = 1;
        g = -1 * (wavelength - 645) / (645 - 580);
        b = 0;
    } else {
        r = 1;
        g = 0;
        b = 0;
    }
    
    // 增强色彩饱和度（提高强度）
    const saturationFactor = 1.3;
    r = Math.min(1, r * saturationFactor);
    g = Math.min(1, g * saturationFactor);
    b = Math.min(1, b * saturationFactor);
    
    // 确保单色光源有足够的亮度
    const minBrightness = 0.3;
    const currentBrightness = 0.3 * r + 0.59 * g + 0.11 * b; // 亮度权重系数

    if (currentBrightness < minBrightness) {
        const brightnessFactor = minBrightness / Math.max(0.01, currentBrightness);
        r = Math.min(1, r * brightnessFactor);
        g = Math.min(1, g * brightnessFactor);
        b = Math.min(1, b * brightnessFactor);
    }
    
    // 转换到0-255范围
    r = Math.round(r * 255);
    g = Math.round(g * 255);
    b = Math.round(b * 255);
    
    return { r, g, b };
} 