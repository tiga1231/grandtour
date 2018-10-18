local utils = {}

function utils.parseFloat32(bytes)
  -- Change to b4,b3,b2,b1 to unpack an LSB float
  -- local b1,b2,b3,b4 = string.byte(str, 1, 4)
  local b4,b3,b2,b1 = string.byte(bytes, 1, 4)

  local exponent = (b1 % 128) * 2 + math.floor(b2 / 128)
  if exponent == 0 then return 0 end
  local sign = (b1 > 127) and -1 or 1
  local mantissa = ((b2 % 128) * 256 + b3) * 256 + b4
  mantissa = (math.ldexp(mantissa, -23) + 1) * sign
  return math.ldexp(mantissa, exponent - 127)
end

function utils.parseInt32(bytes)
  local b4,b3,b2,b1 = string.byte(bytes, 1, 4)
  return (b1* 2^16) + (b2* 2^8) + (b3* 2^4) + b4
end

utils.baseColors = {
  {0.12156862745098039, 0.4666666666666667, 0.7058823529411765},
  {1, 0.4980392156862745, 0.054901960784313725},
  {0.17254901960784313, 0.6274509803921569, 0.17254901960784313},
  {0.8392156862745098, 0.15294117647058825, 0.1568627450980392},
  {0.5803921568627451, 0.403921568627451, 0.7411764705882353},
  {0.5490196078431373, 0.33725490196078434, 0.29411764705882354},
  {0.8901960784313725, 0.4666666666666667, 0.7607843137254902},
  {0.4980392156862745, 0.4980392156862745, 0.4980392156862745},
  {0.7372549019607844, 0.7411764705882353, 0.13333333333333333},
  {0.09019607843137255, 0.7450980392156863, 0.8117647058823529}
}


return utils