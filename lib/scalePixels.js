function isValidImageData(imageData) {
    var _a;
    return !!(imageData &&
        typeof imageData.width === 'number' &&
        typeof imageData.height === 'number' &&
        ((_a = imageData === null || imageData === void 0 ? void 0 : imageData.data) === null || _a === void 0 ? void 0 : _a.length) === imageData.width * imageData.height * 4);
}

function findGCD(a, b) {
    // Order arguments by size to immediately resolve if one value is 0 or 1.
    let x = Math.min(a, b);
    let y = Math.max(a, b);
    // Euclidean algorithm for finding GCD, non-recursive.
    let r;
    while (x % y > 0) {
        r = x % y;
        x = y;
        y = r;
    }
    return y;
}

function findCommonDivisors(a, b) {
    // This function does not use prime factorization or other performance
    // improvements since it is redundant for image dimensions.
    // Increment by 2 if a number is odd, since odd numbers only have odd divisors.
    const hasOdd = a % 2 !== 0 || b % 2 !== 0;
    const increment = hasOdd ? 2 : 1;
    const divisors = [];
    const gcd = findGCD(a, b);
    for (let num = 1; num * 2 <= gcd; num += increment) {
        if (gcd % num === 0) {
            divisors.push(num);
        }
    }
    divisors.push(gcd);
    return divisors;
}

function isMatchingColor(rgbaA, rgbaB, maxColorDiff) {
    return rgbaA.every((rgba, i) => {
        const colorDiff = Math.abs(rgba - rgbaB[i]);
        return colorDiff <= maxColorDiff;
    });
}
function isMatchingRange(data, length, indexA, indexB, maxColorDiff) {
    for (let i = 0; i < length; i++) {
        const colorDiff = Math.abs(data[indexA + i] - data[indexB + i]);
        if (colorDiff > maxColorDiff) {
            return false;
        }
    }
    return true;
}
function getRGBATuple(data, index) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    return [red, green, blue, alpha];
}
function isValidRow(data, scale, rowStart, rowEnd, maxColorDiff) {
    const scaledPixel = scale * 4;
    // loop through each scaled pixel
    for (let scaledStart = rowStart; scaledStart < rowEnd; scaledStart += scaledPixel) {
        const scaledEnd = scaledStart + scaledPixel;
        const expectedRGBA = getRGBATuple(data, scaledStart);
        // loop through each actual pixel (except the first one), comparing them with the first one
        for (let pixelStart = scaledStart + 4; pixelStart < scaledEnd; pixelStart += 4) {
            const rgba = getRGBATuple(data, pixelStart);
            if (!isMatchingColor(expectedRGBA, rgba, maxColorDiff)) {
                return false;
            }
        }
    }
    return true;
}
function isValidScale(imageData, scale, maxColorDiff) {
    const { data, width } = imageData;
    const dataLength = data.length;
    const rowLength = width * 4;
    const scaledRowLength = rowLength * scale;
    // loop through each scaled up row
    for (let scaledRowStart = 0; scaledRowStart < dataLength; scaledRowStart += scaledRowLength) {
        const firstRowStart = scaledRowStart;
        const firstRowEnd = firstRowStart + rowLength;
        // verify that the first row is scaled correctly
        const validRow = isValidRow(data, scale, firstRowStart, firstRowEnd, maxColorDiff);
        if (!validRow) {
            return false;
        }
        // ensure all remaining rows in the scaled row are identical to the top row
        for (let rowCount = 1; rowCount < scale; rowCount++) {
            const rowStart = firstRowStart + rowCount * rowLength;
            const matchinRow = isMatchingRange(data, rowLength, firstRowStart, rowStart, maxColorDiff);
            if (!matchinRow) {
                return false;
            }
        }
    }
    return true;
}
function getPixelScale(imageData, { maxColorDiff = 0 } = {}) {
    const { width, height } = imageData;
    const possibleScales = findCommonDivisors(width, height);
    // if dimensions are only divisable by 1,
    // then we cannot correctly determine the pixel scale
    if (findCommonDivisors.length === 1) {
        return 1;
    }
    else {
        possibleScales.shift();
    }
    // start from largest divisor, since it's more efficient
    // and we want to find the highest possible pixel scale
    for (let scaleIndex = possibleScales.length - 1; scaleIndex >= 0; scaleIndex--) {
        const scale = possibleScales[scaleIndex];
        const validScale = isValidScale(imageData, scale, maxColorDiff);
        if (validScale) {
            return scale;
        }
    }
    // failed to find correct scale, default to 1
    return 1;
}

function scalePixels(imageData, to, { from, maxColorDiff }) {
    const { data, width, height } = imageData;
    const currentScale = from || getPixelScale(imageData, { maxColorDiff: maxColorDiff || 0 });
    const dataLength = data.length;
    const rowLength = width * 4;
    const scaledRowLength = currentScale * rowLength;
    const newScale = to;
    const newWidth = (width / currentScale) * newScale;
    const newHeight = (height / currentScale) * newScale;
    const newData = [];
    // loop through each row of the current scale
    for (let rowStart = 0; rowStart < dataLength; rowStart += scaledRowLength) {
        const rowEnd = rowStart + rowLength;
        // create one row per pixel scale
        for (let rowCount = 0; rowCount < newScale; rowCount++) {
            // loop through each scaled pixel on the row
            for (let pixelStart = rowStart; pixelStart < rowEnd; pixelStart += currentScale * 4) {
                // add the corresponding colors according to the new scale
                for (let colCount = 0; colCount < newScale; colCount++) {
                    newData.push(data[pixelStart]);
                    newData.push(data[pixelStart + 1]);
                    newData.push(data[pixelStart + 2]);
                    newData.push(data[pixelStart + 3]);
                }
            }
        }
    }
    return {
        data: Uint8ClampedArray.from(newData),
        width: newWidth,
        height: newHeight
    }
}

module.exports = {
    scalePixels, getPixelScale
}

