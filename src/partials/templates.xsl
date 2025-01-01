<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

	<xsl:template name="circuit-board">
		<svg viewBox="0 0 277 292">
			<xsl:for-each select="./*">
				<xsl:variable name="pos" select="position()"/>
				<g>
					<xsl:attribute name="transform">translate(33, <xsl:value-of select="14 + ($pos * 22)" />)</xsl:attribute>
					<xsl:choose>
						<xsl:when test="@row = 'empty'"></xsl:when>
						<!-- stumps START -->
						<xsl:when test="@row = '1-stump'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line stream" x1="0" y1="0" x2="40" y2="0"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<circle class="void" cx="45" cy="0" r="5"/>
						</xsl:when>
						<xsl:when test="@row = '2-stump'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line stream" x1="0" y1="0" x2="40" y2="0"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<circle class="void" cx="45" cy="0" r="5"/>
							<rect class="socket disconnected" x="233" y="-5" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
						</xsl:when>
						<xsl:when test="@row = '3-stump'">
							<line class="line" x1="0" y1="0" x2="90" y2="0"/>
							<line class="line stream" x1="0" y1="0" x2="90" y2="0"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<circle class="void" cx="95" cy="0" r="5"/>
						</xsl:when>
						<!-- stumps END -->
						<!-- [C] split group 1 START -->
						<xsl:when test="@row = '1-split-3-2'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<polyline class="line" points="52,-2 60,-2 85,-22 233,-22" />
							<polyline class="line" points="52,2 60,2 85,22 233,22" />
							<line class="line stream" x1="0" y1="0" x2="40" y2="0"/>
							<polyline class="line stream l66" points="52,-2 60,-2 85,-22 233,-22" />
							<polyline class="line stream l66" points="52,2 60,2 85,22 233,22" />
							<line class="line disconnected" x1="138" y1="0" x2="233" y2="0"/>
							<polygon class="gpu disconnected" points="128,-7 138,-7 138,7 123,7 123,-2"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="chip" x="38" y="-7" width="14" height="14"/>
							<rect class="socket" x="233" y="-27" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos - 1"/></xsl:attribute>
							</rect>
							<rect class="socket disconnected" x="233" y="-5" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
							<rect class="socket" x="233" y="17" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos + 1"/></xsl:attribute>
							</rect>
						</xsl:when>
						<!-- split group 1 END -->
						<!-- [C] split group 2 START -->
						<xsl:when test="@row = '2-split-2-1'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line" x1="52" y1="0" x2="233" y2="0"/>
							<polyline class="line" points="52,4 60,4 85,22 144,22 233,22" />
							<line class="line stream" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line stream" x1="52" y1="0" x2="233" y2="0"/>
							<polyline class="line stream l66" points="52,4 60,4 85,22 144,22 233,22" />
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="chip" x="38" y="-5" width="14" height="14"/>
							<rect class="socket" x="233" y="-5" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
							<rect class="socket" x="233" y="17" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos + 1"/></xsl:attribute>
							</rect>
						</xsl:when>
						<!-- split group 2 END -->
						<!-- [C] split group 3 START -->
						<xsl:when test="@row = '3-split-2-2'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line" x1="52" y1="0" x2="233" y2="0"/>
							<polyline class="line" points="52,-4 60,-4 85,-22 144,-22 233,-22" />
							<line class="line stream" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line stream" x1="52" y1="0" x2="233" y2="0"/>
							<polyline class="line stream l66" points="52,-4 60,-4 85,-22 144,-22 233,-22" />
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="chip" x="38" y="-9" width="14" height="14"/>
							<rect class="socket" x="233" y="-27" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos - 1"/></xsl:attribute>
							</rect>
							<rect class="socket" x="233" y="-5" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
						</xsl:when>
						<!-- split group 3 END -->

						<!-- [C] split group 4 START -->
						<xsl:when test="@row = '4-split-6-1'">
							<polyline class="line" points="0,0 143,0 168,20 178,20" />
							<line class="line joint" x1="192" y1="22" x2="234" y2="22" join="i1"/>
							<polyline class="line stream l66" points="0,0 143,0 168,20 178,20" />
							<line class="line joint stream" x1="192" y1="22" x2="234" y2="22" join="s1"/>
							<rect class="chip joint" x="178" y="15" width="14" height="14"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="socket disconnected" x="233" y="-5" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
							<rect class="socket joint" x="233" y="17" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos + 1"/></xsl:attribute>
							</rect>
						</xsl:when>
						<xsl:when test="@row = '4-split-6-4'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<polyline class="line" points="52,-2 60,-2 85,-22 143,-22 168,-42 178,-42" join="i2" prev="2"/>
							<polyline class="line" points="52,2 60,2 85,22 143,22" />
							<polyline class="line" points="157,20 167,20 192,0 234,0" />
							<polyline class="line" points="157,24 167,24 192,44 234,44" />
							<line class="line stream" x1="0" y1="0" x2="40" y2="0"/>
							<polyline class="line stream l66" points="52,-2 60,-2 85,-22 143,-22 168,-42 178,-42" join="s2" />
							<polyline class="line stream l66" points="52,2 60,2 85,22 143,22" />
							<polyline class="line stream l66" points="157,20 167,20 192,0 234,0" />
							<polyline class="line stream l66" points="157,24 167,24 192,44 234,44" />
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="chip" x="38" y="-7" width="14" height="14"/>
							<rect class="chip" x="143" y="15" width="14" height="14"/>
							<rect class="socket disconnected" x="233" y="-27" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos - 1"/></xsl:attribute>
							</rect>
							<rect class="socket" x="233" y="-5" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
							<rect class="socket disconnected" x="233" y="17" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos + 1"/></xsl:attribute>
							</rect>
							<rect class="socket" x="233" y="39" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos + 2"/></xsl:attribute>
							</rect>
						</xsl:when>
						<!-- split group 4 END -->
						
						<!-- [C] split group 5 START -->
						<xsl:when test="@row = '5-split-repeater-3-2'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line" x1="181" y1="-22" x2="233" y2="-22" sub="rep"/>
							<polyline class="line" points="52,-2 60,-2 85,-22 164,-22" />
							<polyline class="line" points="52,2 60,2 85,22 233,22" />
							<line class="line stream" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line stream" x1="181" y1="-22" x2="233" y2="-22" sub="rep"/>
							<polyline class="line stream l66" points="52,-2 60,-2 85,-22 164,-22" />
							<polyline class="line stream l66" points="52,2 60,2 85,22 233,22" />
							<polygon class="repeater" points="164,-29 169,-29 181,-22 169,-15 164,-15" sub="rep"/>
							<line class="line disconnected" x1="138" y1="0" x2="233" y2="0"/>
							<polygon class="gpu disconnected" points="128,-7 138,-7 138,7 123,7 123,-2"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="chip" x="38" y="-7" width="14" height="14"/>
							<rect class="socket" x="233" y="-27" width="13" height="9" rx="3" sub="rep">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos - 1"/></xsl:attribute>
							</rect>
							<rect class="socket disconnected" x="233" y="-5" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
							<rect class="socket" x="233" y="17" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos + 1"/></xsl:attribute>
							</rect>
						</xsl:when>
						<!-- split group 5 END -->
						
						<!-- [C] split group 6 START -->
						<xsl:when test="@row = '6-split-repeater-3-2'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line purple" x1="181" y1="22" x2="233" y2="22" sub="rep"/>
							<polyline class="line" points="52,-2 60,-2 85,-22 233,-22" />
							<polyline class="line" points="52,2 60,2 85,22 164,22" />
							<line class="line stream" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line stream purple" x1="181" y1="22" x2="233" y2="22" sub="rep"/>
							<polyline class="line stream l66" points="52,-2 60,-2 85,-22 233,-22" />
							<polyline class="line stream l66" points="52,2 60,2 85,22 164,22" />
							<polygon class="repeater purple" points="164,29 169,29 181,22 169,15 164,15" sub="rep"/>
							<line class="line disconnected" x1="138" y1="0" x2="233" y2="0"/>
							<polygon class="gpu disconnected" points="128,-7 138,-7 138,7 123,7 123,-2"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="chip" x="38" y="-7" width="14" height="14"/>
							<rect class="socket" x="233" y="-27" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos - 1"/></xsl:attribute>
							</rect>
							<rect class="socket disconnected" x="233" y="-5" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
							<rect class="socket purple" x="233" y="17" width="13" height="9" rx="3" sub="rep">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos + 1"/></xsl:attribute>
							</rect>
						</xsl:when>
						<!-- split group 6 END -->

						<!-- [C] split group 7 START -->
						<xsl:when test="@row = '7-repeater-split-3-2'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line" x1="54" y1="0" x2="105" y2="0" sub="rep"/>
							<polyline class="line" points="119,-2 127,-2 152,-22 233,-22" sub="rep" />
							<polyline class="line" points="119,2 127,2 152,22 233,22" sub="rep" />
							<line class="line stream" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line stream" x1="54" y1="0" x2="105" y2="0" sub="rep"/>
							<polyline class="line stream l66" points="119,-2 127,-2 152,-22 233,-22" sub="rep" />
							<polyline class="line stream l66" points="119,2 127,2 152,22 233,22" sub="rep" />
							<rect class="chip" x="105" y="-7" width="14" height="14" sub="rep"/>
							<polygon class="repeater" points="40,-7 45,-7 57,0 45,7 40,7" sub="rep"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="socket" x="233" y="-27" width="13" height="9" rx="3" sub="rep">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos - 1"/></xsl:attribute>
							</rect>
							<rect class="socket disconnected" x="233" y="-5" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
							<rect class="socket" x="233" y="17" width="13" height="9" rx="3" sub="rep">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos + 1"/></xsl:attribute>
							</rect>
						</xsl:when>
						<!-- split group 7 END -->

						<!-- [C] split join group 1 START -->
						<xsl:when test="@row = '1-split-join-3-2'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<polyline class="line" points="52,-2 60,-2 85,-22 144,-22 169,-2 178,-2" />
							<polyline class="line" points="52,2 60,2 85,22 144,22 169,2 178,2" />
							<line class="line" x1="192" y1="0" x2="233" y2="0"/>
							<line class="line stream" x1="0" y1="0" x2="40" y2="0"/>
							<polyline class="line stream l66" points="52,-2 60,-2 85,-22 144,-22 169,-2 178,-2" />
							<polyline class="line stream l66" points="52,2 60,2 85,22 144,22 169,2 178,2" />
							<line class="line stream" x1="192" y1="0" x2="233" y2="0"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="chip" x="38" y="-7" width="14" height="14"/>
							<rect class="chip" x="178" y="-7" width="14" height="14"/>
							<rect class="socket disconnected" x="233" y="-27" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos - 1"/></xsl:attribute>
							</rect>
							<rect class="socket" x="233" y="-5" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
							<rect class="socket disconnected" x="233" y="17" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos + 1"/></xsl:attribute>
							</rect>
						</xsl:when>
						<!-- split join group 1 END -->

						<!-- [C] join group 1 START -->
						<xsl:when test="@row = '1-join-3-1'">
							<polyline class="line" points="0,0 144,0 169,20 178,20" join="i1"/>
							<line class="line joint" x1="192" y1="22" x2="233" y2="22"/>
							<polyline class="line stream l66" points="0,0 144,0 169,20 178,20" join="s1"/>
							<line class="line joint stream" x1="192" y1="22" x2="233" y2="22"/>
							<rect class="chip joint" x="178" y="15" width="14" height="14"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="socket disconnected" x="233" y="-5" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
							<rect class="socket joint" x="233" y="17" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos + 1"/></xsl:attribute>
							</rect>
						</xsl:when>
						<xsl:when test="@row = '1-join-3-2'">
							<line class="line" x1="0" y1="0" x2="105" y2="0"/>
							<line class="line stream" x1="0" y1="0" x2="105" y2="0"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<circle class="diode" cx="105" cy="0" r="5"/>
						</xsl:when>
						<xsl:when test="@row = '1-join-3-3'">
							<polyline class="line" points="0,0 144,0 169,-20 178,-20" join="i2" prev="1"/>
							<polyline class="line stream l66" points="0,0 144,0 169,-20 178,-20" join="s2" />
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="socket disconnected" x="233" y="-5" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
						</xsl:when>
						<!-- join group 1 END -->
						<!-- [C] join group 2 START -->
						<xsl:when test="@row = '2-join-2-1'">
							<line class="line" x1="0" y1="0" x2="178" y2="0" join="i1"/>
							<line class="line joint" x1="192" y1="0" x2="233" y2="0"/>
							<line class="line stream" x1="0" y1="0" x2="178" y2="0" join="s1"/>
							<line class="line joint stream" x1="192" y1="0" x2="233" y2="0"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="chip joint" x="178" y="-5" width="14" height="14"/>
							<rect class="socket joint" x="233" y="-5" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
						</xsl:when>
						<xsl:when test="@row = '2-join-2-2'">
							<polyline class="line" points="0,0 144,0 169,-18 178,-18" join="i2" prev="0"/>
							<polyline class="line stream l66" points="0,0 144,0 169,-18 178,-18" join="s2" />
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="socket disconnected" x="233" y="-5" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
						</xsl:when>
						<!-- join group 2 END -->
						<!-- [C] join group 3 START -->
						<xsl:when test="@row = '3-join-2-1'">
							<polyline class="line" points="0,0 144,0 169,18 178,18" join="i3" next="0"/>
							<polyline class="line stream l66" points="0,0 144,0 169,18 178,18" join="s3" />
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="socket disconnected" x="233" y="-5" width="13" height="9" rx="3">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
						</xsl:when>
						<xsl:when test="@row = '3-join-2-2'">
							<line class="line" x1="0" y1="0" x2="178" y2="0" join="i1"/>
							<line class="line joint" x1="192" y1="0" x2="233" y2="0"/>
							<line class="line stream" x1="0" y1="0" x2="178" y2="0" join="s1"/>
							<line class="line joint stream" x1="192" y1="0" x2="233" y2="0"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="chip joint" x="178" y="-9" width="14" height="14"/>
							<rect class="socket joint" x="233" y="-5" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
						</xsl:when>
						<!-- join group 3 END -->

						<!-- [C] repeaters START -->
						<xsl:when test="@row = '1-repeater'">
							<line class="line" x1="0" y1="0" x2="144" y2="0"/>
							<line class="line" x1="159" y1="0" x2="234" y2="0" sub="rep"/>
							<line class="line stream l66" x1="0" y1="0" x2="144" y2="0"/>
							<line class="line stream l65" x1="159" y1="0" x2="234" y2="0" sub="rep"/>
							<polygon class="repeater" points="144,-7 149,-7 161,0 149,7 144,7" sub="rep"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="socket" x="233" y="-5" width="13" height="9" rx="3" sub="rep">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
						</xsl:when>
						<xsl:when test="@row = '2-repeater'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line purple" x1="54" y1="0" x2="234" y2="0" sub="rep"/>
							<line class="line stream l65" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line stream purple l66" x1="54" y1="0" x2="234" y2="0" sub="rep"/>
							<polygon class="repeater purple" points="40,-7 45,-7 57,0 45,7 40,7" sub="rep"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="socket purple" x="233" y="-5" width="13" height="9" rx="3" sub="rep">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
						</xsl:when>
						<xsl:when test="@row = '3-repeater'">
							<line class="line" x1="0" y1="0" x2="144" y2="0"/>
							<line class="line purple" x1="159" y1="0" x2="234" y2="0" sub="rep"/>
							<line class="line stream l66" x1="0" y1="0" x2="144" y2="0"/>
							<line class="line stream l65 purple" x1="159" y1="0" x2="234" y2="0" sub="rep"/>
							<polygon class="repeater purple" points="144,-7 149,-7 161,0 149,7 144,7" sub="rep"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="socket purple" x="233" y="-5" width="13" height="9" rx="3" sub="rep">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
						</xsl:when>
						<xsl:when test="@row = '4-repeater'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line" x1="54" y1="0" x2="234" y2="0" sub="rep"/>
							<line class="line stream l65" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line stream l66" x1="54" y1="0" x2="234" y2="0" sub="rep"/>
							<polygon class="repeater" points="40,-7 45,-7 57,0 45,7 40,7" sub="rep"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="socket" x="233" y="-5" width="13" height="9" rx="3" sub="rep">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
						</xsl:when>
						<!-- repeaters END -->

						<!-- [C] simple line -->
						<xsl:otherwise>
							<line class="line" x1="0" y1="0" x2="234" y2="0"/>
							<line class="line stream" x1="0" y1="0" x2="234" y2="0"/>
							<circle class="start" cx="-3" cy="0" r="3"/>
							<rect class="socket" x="233" y="-5" width="13" height="9" rx="3" sub="soc">
								<xsl:attribute name="data-pos"><xsl:value-of select="$pos"/></xsl:attribute>
							</rect>
						</xsl:otherwise>
					</xsl:choose>
				</g>
			</xsl:for-each>
		</svg>
	</xsl:template>


	<xsl:template name="layer-background">
		<div class="layer-background" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='background']/*">
				<b>
					<xsl:attribute name="class"><xsl:value-of select="@id" /></xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-collision">
		<div class="layer-collision" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='collision']/*">
				<b>
					<xsl:attribute name="class"><xsl:value-of select="@id" /></xsl:attribute>
					<xsl:attribute name="style">
						--x: <xsl:value-of select="@x" />px;
						--y: <xsl:value-of select="@y" />px;
						<xsl:if test="@w">--w: <xsl:value-of select="@w" />px;</xsl:if>
						<xsl:if test="@h">--h: <xsl:value-of select="@h" />px;</xsl:if>
					</xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-action">
		<div class="layer-action" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='action']/*">
				<b>
					<xsl:attribute name="class">a1</xsl:attribute>
					<xsl:attribute name="style">
						<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
						<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
						<xsl:if test="@w">--w: <xsl:value-of select="@w" />;</xsl:if>
						<xsl:if test="@h">--h: <xsl:value-of select="@h" />;</xsl:if>
					</xsl:attribute>
					<xsl:attribute name="data-action"><xsl:value-of select="@action" /></xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-los">
		<div class="layer-los" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<!-- walls -->
			<xsl:for-each select="./Layer[@id='los']/walls">
				<xsl:variable name="pos" select="position()"/>
				<xsl:for-each select="./*">
					<div class="segment">
						<xsl:attribute name="data-group"><xsl:value-of select="$pos" /></xsl:attribute>
						<xsl:if test="position() = 1"><xsl:attribute name="data-type">start</xsl:attribute></xsl:if>
						<xsl:if test="position() > 1 and @x = ../*[position() = 1]/@x and @y = ../*[position() = 1]/@y"><xsl:attribute name="data-type">end</xsl:attribute></xsl:if>
						<xsl:attribute name="style">
							--sx: <xsl:value-of select="@x" />;
							--sy: <xsl:value-of select="@y" />;
							<xsl:if test="@w">--sw: <xsl:value-of select="@w" />;</xsl:if>
							<xsl:if test="@h">--sh: <xsl:value-of select="@h" />;</xsl:if>
							<xsl:if test="@d = '.5' or @d = '1.5'">--sa: <xsl:value-of select="@d" />;</xsl:if>
						</xsl:attribute>
					</div>
				</xsl:for-each>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-lights">
		<div class="layer-lights hide-helpers" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='lights']/*">
				<div class="spotlight">
					<!-- <xsl:if test="position() = 1"><xsl:attribute name="class">spotlight active</xsl:attribute></xsl:if> -->
					<xsl:attribute name="style">
						--x: <xsl:value-of select="@x" />;
						--y: <xsl:value-of select="@y" />;
						--r: <xsl:value-of select="@r" />;
					</xsl:attribute>
					<span class="handle"></span>
				</div>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-droids">
		<div class="layer-droids" data-click="put-tile">
			<xsl:for-each select="./Layer[@id='droids']/*[@patrol != '']">
			<div class="patrol-group">
				<xsl:for-each select="./*">
				<xsl:choose>
					<xsl:when test="position() = 1">
						<span class="droid">
							<xsl:attribute name="data-nr"><xsl:value-of select="../@nr" /></xsl:attribute>
							<xsl:attribute name="data-id"><xsl:value-of select="../@id" /></xsl:attribute>
							<xsl:attribute name="style">--x: <xsl:value-of select="@x" />; --y: <xsl:value-of select="@y" />;</xsl:attribute>
							<b></b>
						</span>
					</xsl:when>
					<xsl:otherwise>
						<span class="patrol-point">
							<xsl:attribute name="data-nr"><xsl:value-of select="../@nr" /></xsl:attribute>
							<xsl:attribute name="style">--x: <xsl:value-of select="@x" />; --y: <xsl:value-of select="@y" />;</xsl:attribute>
						</span>
					</xsl:otherwise>
				</xsl:choose>
				</xsl:for-each>
			</div>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="droids-list">
		<xsl:for-each select="./*">
			<div class="row">
				<!-- <xsl:if test="position() = 2"><xsl:attribute name="class">row active</xsl:attribute></xsl:if> -->
				<span>#<xsl:value-of select="@nr" /></span>
				<span><xsl:value-of select="@id" /></span>
				<span><xsl:value-of select="@patrol" /></span>
			</div>
		</xsl:for-each>
	</xsl:template>

</xsl:stylesheet>