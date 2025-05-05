/**
 * A simple cursor component that can be used to indicate the current input position.
 *
 * @component
 * @param {Object} props - Component properties
 * @param {string} props.inputLength - Length of the input field preceding the cursor as string
 * @param {boolean} [props.blink=false] - Whether the cursor should blink
 * @param {boolean} [props.hidden=true] - Whether the cursor should be hidden
 * @param {boolean} [props.input=false] - Whether the cursor is used as a caret for a input box
 * @param {boolean} [props.inputLength] - Length of the input preceding the cursor
 * @param {React.CSSProperties} [props.style] - Additional inline styles
 */
export default function Cursor({
  input = false,
  inputLength,
  blink = false,
  hidden = false,
  style = {},
}) {
  return (
    <span
      className={`cursor-block ${blink ? "cursor-blink" : ""}`}
      style={{
        pointerEvents: "none",
        display: hidden ? "none" : "inline-block",
        ...(input && {
          position: "absolute",
          left: `${inputLength ? inputLength : 0}ch`,
          top: 0,
        }),
        ...style,
      }}
    >
      {"\u2588"}
    </span>
  );
}
