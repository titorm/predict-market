'use client';

import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import { CaretDown, Check, WarningCircle } from '@phosphor-icons/react';

export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
  detail?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface OptionElementProps {
  value?: string | number;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  showOptionalBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'surface';
  leftIcon?: React.ReactNode;
  options?: SelectOption[];
  containerClassName?: string;
  dropdownClassName?: string;
  onValueChange?: (value: string) => void;
}

function extractTextFromNode(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromNode).join('');
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractTextFromNode(node.props.children);
  }
  return '';
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      placeholder = 'Selecione uma opção',
      showOptionalBadge = false,
      size = 'md',
      variant = 'default',
      leftIcon,
      options,
      containerClassName = 'w-full',
      dropdownClassName = '',
      required,
      className = '',
      id,
      name,
      value,
      defaultValue,
      disabled = false,
      onChange,
      onValueChange,
      children,
    },
    _ref
  ) => {
    const generatedId = useId();
    const selectId =
      id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : `select-${generatedId}`);
    const listboxId = `${selectId}-listbox`;
    const errorId = error ? `${selectId}-error` : undefined;
    const hintId = hint ? `${selectId}-hint` : undefined;

    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [internalValue, setInternalValue] = useState<string>(() => {
      if (value !== undefined) return String(value);
      if (defaultValue !== undefined) return String(defaultValue);
      return '';
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const parsedOptions = useMemo<SelectOption[]>(() => {
      if (options && options.length > 0) {
        return options;
      }
      const extracted: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement<OptionElementProps>(child) && child.type === 'option') {
          const rawLabel = extractTextFromNode(child.props.children).trim();
          const rawValue =
            child.props.value !== undefined ? child.props.value : rawLabel;
          extracted.push({
            value: rawValue,
            label: rawLabel,
            disabled: Boolean(child.props.disabled),
          });
        }
      });
      return extracted;
    }, [options, children]);

    const currentValue = value !== undefined ? String(value) : internalValue;

    const selectedOption = useMemo(() => {
      if (parsedOptions.length === 0) return undefined;
      return (
        parsedOptions.find((opt) => String(opt.value) === currentValue) ||
        parsedOptions[0]
      );
    }, [parsedOptions, currentValue]);

    useEffect(() => {
      if (!isOpen) return;

      const handleOutsideClick = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          queueMicrotask(() => {
            setIsOpen(false);
            setHighlightedIndex(-1);
          });
        }
      };

      document.addEventListener('mousedown', handleOutsideClick);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }, [isOpen]);

    const selectOption = (opt: SelectOption) => {
      if (opt.disabled || disabled) return;
      const nextValue = String(opt.value);
      setInternalValue(nextValue);
      setIsOpen(false);
      setHighlightedIndex(-1);
      onValueChange?.(nextValue);

      if (onChange) {
        const syntheticEvent = {
          target: { value: nextValue, name: name ?? '' },
          currentTarget: { value: nextValue, name: name ?? '' },
          preventDefault: () => {},
          stopPropagation: () => {},
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }

      triggerRef.current?.focus();
    };

    const toggleOpen = () => {
      if (disabled) return;
      const nextOpen = !isOpen;
      setIsOpen(nextOpen);
      if (nextOpen) {
        const currentIdx = parsedOptions.findIndex(
          (opt) => String(opt.value) === String(selectedOption?.value)
        );
        setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
      } else {
        setHighlightedIndex(-1);
      }
    };

    const scrollOptionIntoView = (index: number) => {
      if (!listRef.current) return;
      const items = listRef.current.querySelectorAll('li');
      const target = items[index];
      if (target) {
        target.scrollIntoView({ block: 'nearest' });
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      if (!isOpen) {
        if (
          event.key === 'ArrowDown' ||
          event.key === 'ArrowUp' ||
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();
          setIsOpen(true);
          const currentIdx = parsedOptions.findIndex(
            (opt) => String(opt.value) === String(selectedOption?.value)
          );
          setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        return;
      }

      if (event.key === 'Tab') {
        setIsOpen(false);
        setHighlightedIndex(-1);
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIdx =
          highlightedIndex < parsedOptions.length - 1 ? highlightedIndex + 1 : 0;
        setHighlightedIndex(nextIdx);
        scrollOptionIntoView(nextIdx);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIdx =
          highlightedIndex > 0 ? highlightedIndex - 1 : parsedOptions.length - 1;
        setHighlightedIndex(prevIdx);
        scrollOptionIntoView(prevIdx);
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const targetOpt = parsedOptions[highlightedIndex];
        if (targetOpt && !targetOpt.disabled) {
          selectOption(targetOpt);
        }
      }
    };

    const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
      sm: 'min-h-[40px] py-1.5 px-3 text-[13px] rounded-md',
      md: 'min-h-[48px] py-2 px-3.5 text-[14px] rounded-sm',
      lg: 'min-h-[56px] py-2.5 px-3.5 text-[16px] rounded-sm',
    };

    const variantStyles: Record<'default' | 'surface', string> = {
      default: 'bg-canvas',
      surface: 'bg-surface-soft',
    };

    const caretSizes: Record<'sm' | 'md' | 'lg', number> = {
      sm: 14,
      md: 16,
      lg: 18,
    };

    const borderStateClass = error
      ? 'border-error bg-error/[0.02] ring-1 ring-error'
      : isOpen
      ? 'border-2 border-ink bg-canvas shadow-xs'
      : 'border border-hairline hover:border-hairline-strong';

    const triggerClass = [
      'w-full flex items-center justify-between gap-2 text-left text-ink transition-all focus:outline-none focus-visible:border-2 focus-visible:border-ink select-none',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      sizeStyles[size],
      isOpen ? 'bg-canvas' : variantStyles[variant],
      borderStateClass,
      className,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    const activeTriggerIcon = selectedOption?.icon ?? leftIcon;

    return (
      <div ref={containerRef} className={`relative ${containerClassName}`.trim()}>
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={selectId}
              className="block text-[12px] font-bold text-ink tracking-tight"
            >
              {label}
              {required && <span className="text-error ml-1">*</span>}
            </label>
            {!required && showOptionalBadge && (
              <span className="text-[11px] text-muted font-normal">(opcional)</span>
            )}
          </div>
        )}

        {name && (
          <input
            type="hidden"
            name={name}
            value={selectedOption ? String(selectedOption.value) : ''}
            required={required}
          />
        )}

        <button
          id={selectId}
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-invalid={!!error}
          aria-describedby={errorId || hintId}
          disabled={disabled}
          onClick={toggleOpen}
          onKeyDown={handleKeyDown}
          className={triggerClass}
        >
          <span className="flex items-center gap-2.5 min-w-0 flex-1">
            {activeTriggerIcon && (
              <span className="shrink-0 text-primary flex items-center justify-center">
                {activeTriggerIcon}
              </span>
            )}
            <span className="truncate font-medium text-ink">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>

          <span className="flex items-center gap-2 shrink-0">
            {selectedOption?.detail && (
              <span className="text-[11px] font-semibold tabular-nums text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                {selectedOption.detail}
              </span>
            )}
            <CaretDown
              size={caretSizes[size]}
              weight="bold"
              className={`shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-ink' : 'text-muted'
              }`}
            />
          </span>
        </button>

        {isOpen && !disabled && (
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={selectId}
            onMouseDown={(e) => e.preventDefault()}
            className={`absolute z-50 left-0 right-0 min-w-[240px] mt-1.5 bg-canvas border border-hairline rounded-md shadow-airbnb overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 ${dropdownClassName}`.trim()}
          >
            <ul
              ref={listRef}
              className="max-h-[260px] overflow-y-auto divide-y divide-hairline-soft py-1"
            >
              {parsedOptions.length === 0 ? (
                <li className="px-4 py-4 text-center text-[13px] text-muted bg-canvas">
                  Nenhuma opção disponível
                </li>
              ) : (
                parsedOptions.map((opt, index) => {
                  const isSelected =
                    String(opt.value) === String(selectedOption?.value);
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li
                      key={String(opt.value)}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled}
                      onClick={() => selectOption(opt)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed bg-canvas'
                          : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'bg-surface-soft text-ink'
                          : isHighlighted
                          ? 'bg-surface-soft text-ink'
                          : 'bg-canvas text-ink hover:bg-surface-soft'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {opt.icon && (
                          <div
                            className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-primary text-white'
                                : 'bg-surface-strong text-muted'
                            }`}
                          >
                            {opt.icon}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-[13px] leading-snug truncate ${
                              isSelected ? 'font-bold text-primary' : 'font-medium text-ink'
                            }`}
                          >
                            {opt.label}
                          </p>
                          {opt.description && (
                            <p className="text-[11px] text-muted truncate mt-0.5">
                              {opt.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {opt.detail && (
                          <span
                            className={`text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                              isSelected
                                ? 'bg-primary text-white'
                                : 'bg-surface-strong text-body'
                            }`}
                          >
                            {opt.detail}
                          </span>
                        )}
                        {isSelected && (
                          <Check size={15} weight="bold" className="text-primary shrink-0" />
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}

        {hint && !error && (
          <p id={hintId} className="text-[12px] text-muted mt-1.5 font-normal">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-[12px] text-error mt-1.5 font-medium flex items-center gap-1.5 animate-in fade-in duration-150"
          >
            <WarningCircle size={15} weight="bold" className="shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
