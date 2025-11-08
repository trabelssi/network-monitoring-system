export default function ApplicationLogo(props) {
    return (
        <img
            src="/glpi-logo.png"
            alt="Sancella Logo"
            style={{ maxWidth: '100%', height: 'auto', ...props.style }}
            className={props.className}
        />
    );
}
