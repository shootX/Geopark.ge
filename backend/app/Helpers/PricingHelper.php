<?php

namespace App\Helpers;

use App\Models\Parking;
use App\Models\PricingRule;
use Illuminate\Support\Facades\Log;

class PricingHelper
{
    private const ALLOWED_VARIABLES = [
        'base_price', 'hours', 'multiplier', 'demand_factor',
        'demand_multiplier', 'weekend_multiplier', 'hourly_rate',
    ];

    /**
     * Evaluate a pricing formula safely using Shunting-yard algorithm.
     * NO eval(), NO exec(), NO security bypass vectors.
     */
    public static function evaluateFormula(string $formula, array $variables): float
    {
        $vars = [];
        foreach (self::ALLOWED_VARIABLES as $key) {
            $vars[$key] = $variables[$key] ?? 0;
        }

        $expression = $formula;
        foreach ($vars as $key => $value) {
            $expression = str_replace("{{$key}}", (string) $value, $expression);
        }

        try {
            $result = self::evaluateMathExpression($expression);
            return round(max(0, $result), 2);
        } catch (\Throwable $e) {
            Log::error('Pricing formula evaluation failed', [
                'formula' => $formula,
                'variables' => $variables,
                'error' => $e->getMessage(),
            ]);
            return $variables['base_price'] ?? 0;
        }
    }

    /**
     * Parse and evaluate a mathematical expression safely using Shunting-yard algorithm.
     * Supports: +, -, *, /, %, (), decimal numbers
     * Uses: Shunting-yard (infix→RPN) + RPN evaluation
     * NO eval(), NO exec(), NO assertions.
     */
    private static function evaluateMathExpression(string $expression): float
    {
        // Remove all whitespace
        $expression = preg_replace('/\s+/', '', $expression);
        if ($expression === '') return 0.0;

        // Validate: only allowed characters
        if (!preg_match('/^[0-9+\-*\/%.()]+$/', $expression)) {
            throw new \InvalidArgumentException('Expression contains invalid characters');
        }

        $tokens = self::tokenize($expression);
        $rpn = self::shuntingYard($tokens);

        return self::evaluateRPN($rpn);
    }

    /**
     * Tokenize expression into numbers, operators, and parentheses
     */
    private static function tokenize(string $expression): array
    {
        $tokens = [];
        $len = strlen($expression);
        $i = 0;

        while ($i < $len) {
            $char = $expression[$i];

            if (in_array($char, ['+', '-', '*', '/', '%', '(', ')'], true)) {
                // Handle unary minus: if '-' is at start or after '(' or after an operator
                if ($char === '-') {
                    $prev = $tokens[count($tokens) - 1] ?? null;
                    if ($prev === null || $prev === '(' || in_array($prev, ['+', '-', '*', '/', '%'], true)) {
                        // This is a unary minus — read the number after it
                        $i++;
                        $numStr = '-';
                        while ($i < $len && (ctype_digit($expression[$i]) || $expression[$i] === '.')) {
                            $numStr .= $expression[$i];
                            $i++;
                        }
                        if ($numStr === '-') {
                            throw new \InvalidArgumentException('Invalid expression: unary minus without number');
                        }
                        $tokens[] = (float) $numStr;
                        continue;
                    }
                }
                $tokens[] = $char;
                $i++;
            } elseif (ctype_digit($char)) {
                $numStr = '';
                while ($i < $len && (ctype_digit($expression[$i]) || $expression[$i] === '.')) {
                    $numStr .= $expression[$i];
                    $i++;
                }
                $tokens[] = (float) $numStr;
            } else {
                throw new \InvalidArgumentException("Unexpected character: {$char}");
            }
        }

        return $tokens;
    }

    /**
     * Shunting-yard algorithm: convert infix tokens to Reverse Polish Notation
     */
    private static function shuntingYard(array $tokens): array
    {
        $precedence = ['+' => 2, '-' => 2, '*' => 3, '/' => 3, '%' => 3];
        $associativity = ['+' => 'left', '-' => 'left', '*' => 'left', '/' => 'left', '%' => 'left'];

        $output = [];
        $operators = [];

        foreach ($tokens as $token) {
            if (is_float($token)) {
                $output[] = $token;
            } elseif ($token === '(') {
                $operators[] = $token;
            } elseif ($token === ')') {
                while (count($operators) > 0 && end($operators) !== '(') {
                    $output[] = array_pop($operators);
                }
                if (count($operators) === 0 || array_pop($operators) !== '(') {
                    throw new \InvalidArgumentException('Mismatched parentheses');
                }
            } else {
                // Operator
                while (count($operators) > 0 && end($operators) !== '(') {
                    $top = end($operators);
                    if (
                        ($associativity[$token] === 'left' && $precedence[$token] <= $precedence[$top]) ||
                        ($associativity[$token] === 'right' && $precedence[$token] < $precedence[$top])
                    ) {
                        $output[] = array_pop($operators);
                    } else {
                        break;
                    }
                }
                $operators[] = $token;
            }
        }

        while (count($operators) > 0) {
            $op = array_pop($operators);
            if ($op === '(' || $op === ')') {
                throw new \InvalidArgumentException('Mismatched parentheses');
            }
            $output[] = $op;
        }

        return $output;
    }

    /**
     * Evaluate an RPN (Reverse Polish Notation) expression
     */
    private static function evaluateRPN(array $rpn): float
    {
        $stack = [];

        foreach ($rpn as $token) {
            if (is_float($token)) {
                $stack[] = $token;
            } else {
                $b = array_pop($stack);
                $a = array_pop($stack);

                if ($a === null || $b === null) {
                    throw new \InvalidArgumentException('Invalid expression: insufficient operands');
                }

                $result = match ($token) {
                    '+' => $a + $b,
                    '-' => $a - $b,
                    '*' => $a * $b,
                    '/' => $b == 0 ? throw new \DivisionByZeroError('Division by zero') : $a / $b,
                    '%' => $b == 0 ? throw new \DivisionByZeroError('Modulo by zero') : fmod($a, $b),
                    default => throw new \InvalidArgumentException("Unknown operator: {$token}"),
                };

                $stack[] = $result;
            }
        }

        if (count($stack) !== 1) {
            throw new \InvalidArgumentException('Invalid expression');
        }

        return (float) $stack[0];
    }

    /**
     * Calculate price for a parking spot
     */
    public static function calculatePrice(
        Parking $parking,
        float $hours,
        ?PricingRule $rule = null
    ): array {
        $demandFactor = self::calculateDemandFactor($parking);
        $weekendMultiplier = self::isWeekend() ? 1.2 : 1.0;

        $variables = [
            'base_price' => $parking->base_price ?? 0,
            'hours' => $hours,
            'multiplier' => $rule->multiplier ?? 1.0,
            'demand_factor' => $demandFactor,
            'demand_multiplier' => $demandFactor,
            'weekend_multiplier' => $weekendMultiplier,
            'hourly_rate' => $parking->base_price ?? 0,
        ];

        if ($rule && $rule->is_active) {
            $price = self::evaluateFormula($rule->formula, $variables);
        } else {
            $price = ($parking->base_price ?? 0) * $hours;
        }

        return [
            'price' => round($price, 2),
            'base_price' => (float) ($parking->base_price ?? 0),
            'hours' => $hours,
            'demand_factor' => $demandFactor,
            'weekend_multiplier' => $weekendMultiplier,
            'formula' => $rule->formula ?? 'base_price * hours',
            'rule_applied' => $rule?->name ?? 'default',
        ];
    }

    /**
     * Calculate demand factor based on occupancy rate
     */
    public static function calculateDemandFactor(Parking $parking): float
    {
        $totalSlots = $parking->total_slots;
        if ($totalSlots <= 0) return 1.0;

        $occupiedSlots = $totalSlots - $parking->available_slots;
        $occupancyRate = $occupiedSlots / $totalSlots;

        return match (true) {
            $occupancyRate >= 0.9 => 2.0,
            $occupancyRate >= 0.75 => 1.5,
            $occupancyRate >= 0.5 => 1.2,
            $occupancyRate >= 0.25 => 1.0,
            default => 0.8,
        };
    }

    private static function isWeekend(): bool
    {
        return now()->isWeekend();
    }
}
