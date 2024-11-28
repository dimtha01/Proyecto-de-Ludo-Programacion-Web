import "./styles.css";

const Ribbon = ({ title = "" }: { title: string }) => (
  <div className="ribbon">
    <div className="ribbon-content">
      <p>
        <b>{title}</b>
      </p>
    </div>
  </div>
);

export default Ribbon;
