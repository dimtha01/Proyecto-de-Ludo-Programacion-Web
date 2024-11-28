import "./styles.css";
import { ModalShareButtons, ModalShareHeader } from "./components";
import { usePortal } from "../../../hooks";
import FocusTrap from "focus-trap-react";
import React from "react";

interface ModalShareProps {
  data: ShareData;
  isVisible: boolean;
  onCloseModal: (isShare?: boolean) => void;
}

const Modal = (props: ModalShareProps) => {
  const render = usePortal({
    container: ".screen",
    id: "overlay-share",
  });

  return render(
    props.isVisible && (
      <div className="modal-share-container">
        <FocusTrap focusTrapOptions={{ escapeDeactivates: false }}>
          <div className="modal-share-wrapper">
            <ModalShareHeader onCloseModal={props.onCloseModal} />
            <ModalShareButtons {...props} />
          </div>
        </FocusTrap>
      </div>
    )
  );
};

export default React.memo(Modal);
