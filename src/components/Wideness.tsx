import { useEffect } from "react";

export default function Wideness(props: { wide?: boolean }) {
  useEffect(() => {
    if (props.wide) {
      document.body.classList.add("wide");
    } else {
      document.body.classList.remove("wide");
    }
  }, [props.wide]);
  return null;
}
