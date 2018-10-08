local utils = {}

function utils.toFloat(str)
  -- Change to b4,b3,b2,b1 to unpack an LSB float
  -- local b1,b2,b3,b4 = string.byte(str, 1, 4)
  local b4,b3,b2,b1 = string.byte(str, 1, 4)

  local exponent = (b1 % 128) * 2 + math.floor(b2 / 128)
  if exponent == 0 then return 0 end
  local sign = (b1 > 127) and -1 or 1
  local mantissa = ((b2 % 128) * 256 + b3) * 256 + b4
  mantissa = (math.ldexp(mantissa, -23) + 1) * sign
  return math.ldexp(mantissa, exponent - 127)
end

function utils.toInt(b)
  -- Change to b4,b3,b2,b1 to unpack an LSB float
  local b1 = string.byte(b, 1, 1)
  return b1
end

return utils