const NotFoundIcon = () => {
  return (
    <svg
      className='not-found-svg mx-auto'
      width='200'
      height='200'
      viewBox='0 0 200 200'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      {/* Background circle */}
      <circle
        cx='100'
        cy='100'
        r='90'
        fill='#2C2C2C'
        stroke='#8A65FD'
        strokeWidth='4'
      />

      {/* Broken link path */}
      <path
        d='M50 80 C 70 60, 130 60, 150 80'
        stroke='#FF5555'
        strokeWidth='8'
        strokeLinecap='round'
        strokeDasharray='10 10'
      />
      <path
        d='M50 120 C 70 140, 130 140, 150 120'
        stroke='#FF5555'
        strokeWidth='8'
        strokeLinecap='round'
        strokeDasharray='10 10'
      />

      {/* Question mark in the middle */}
      <text
        x='100'
        y='115'
        fontFamily='Arial, sans-serif'
        fontSize='80'
        fontWeight='bold'
        fill='#8A65FD'
        textAnchor='middle'
        dominantBaseline='middle'
      >
        ?
      </text>

      {/* Small "X" marks for error */}
      <line
        x1='70'
        y1='70'
        x2='80'
        y2='80'
        stroke='#FF5555'
        strokeWidth='4'
        strokeLinecap='round'
      />
      <line
        x1='80'
        y1='70'
        x2='70'
        y2='80'
        stroke='#FF5555'
        strokeWidth='4'
        strokeLinecap='round'
      />
      <line
        x1='120'
        y1='70'
        x2='130'
        y2='80'
        stroke='#FF5555'
        strokeWidth='4'
        strokeLinecap='round'
      />
      <line
        x1='130'
        y1='70'
        x2='120'
        y2='80'
        stroke='#FF5555'
        strokeWidth='4'
        strokeLinecap='round'
      />
    </svg>
  )
}

export default NotFoundIcon;